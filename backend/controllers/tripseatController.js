const TripSeat = require("../models/tripseatModel");
const Seat = require("../models/seatModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes for counter sales

// ── Helper: release expired locks for a trip ───────────────────────────────
async function releaseExpiredLocks(tripId) {
  const filter = {
    status: "locked",
    lockedUntil: { $lt: new Date() }
  };
  if (tripId) filter.trip = tripId;
  await TripSeat.updateMany(filter, {
    status: "available",
    lockedBy: null,
    lockedAt: null,
    lockedUntil: null
  });
}

// POST /api/trip-seats/generate/:tripId  (admin)
exports.generateTripSeats = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId).populate("bus");
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const seats = await Seat.find({ bus: trip.bus._id });

  if (seats.length === 0) {
    return res.status(400).json({ message: "No seats found for this bus. Generate bus seats first." });
  }

  // Remove any previously generated trip seats to avoid duplicates
  await TripSeat.deleteMany({ trip: tripId });

  const tripSeats = seats.map(seat => ({
    trip: tripId,
    seat: seat._id,
    status: "available"
  }));

  await TripSeat.insertMany(tripSeats);

  res.json({ message: "Trip seats generated", total: tripSeats.length });
});

// GET /api/trip-seats/:tripId
exports.getTripSeats = asyncHandler(async (req, res) => {
  await releaseExpiredLocks(req.params.tripId);

  const seats = await TripSeat.find({ trip: req.params.tripId })
    .populate("seat")
    .populate("lockedBy", "username email");
  res.json(seats);
});

// GET /api/trip-seats/:tripId/count
exports.getSeatCount = asyncHandler(async (req, res) => {
  await releaseExpiredLocks(req.params.tripId);

  const [available, booked, locked] = await Promise.all([
    TripSeat.countDocuments({ trip: req.params.tripId, status: "available" }),
    TripSeat.countDocuments({ trip: req.params.tripId, status: "booked" }),
    TripSeat.countDocuments({ trip: req.params.tripId, status: "locked" }),
  ]);

  res.json({ available, booked, locked, total: available + booked + locked });
});

// POST /api/trip-seats/lock/:tripSeatId  (any authenticated user)
// Lock duration: 15 minutes
// Uses atomic findOneAndUpdate to prevent race conditions / double-booking.
// Only ONE concurrent request can win the lock — others receive 409.
exports.lockSeat = asyncHandler(async (req, res) => {
  const { tripSeatId } = req.params;
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);

  // ── Chiến lược atomic ────────────────────────────────────────────────────────
  // Filter chỉ match khi ghế ở trạng thái an toàn để lock:
  //   1. status === 'available'  → chưa ai giữ
  //   2. status === 'locked' AND (lock hết hạn OR chính user đang lock lại)
  // Nếu 2 request đến đồng thời, MongoDB chỉ cho 1 cái thắng (atomic update).
  // Cái thua sẽ nhận null → trả 409 ngay lập tức.
  const atomicFilter = {
    _id: tripSeatId,
    $or: [
      { status: "available" },
      { status: "locked", lockedUntil: { $lte: now } },                // lock expired
      { status: "locked", lockedBy: req.user.id }                       // same user re-locks
    ]
  };

  const updated = await TripSeat.findOneAndUpdate(
    atomicFilter,
    {
      $set: {
        status: "locked",
        lockedBy: req.user.id,
        lockedAt: now,
        lockedUntil,
      }
    },
    { new: true }
  ).populate("seat").populate("lockedBy", "username email");

  if (!updated) {
    // Seat does not exist OR is actively locked by someone else → check which
    const seat = await TripSeat.findById(tripSeatId);
    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }
    if (seat.status === "booked") {
      return res.status(400).json({ message: "Seat is already booked" });
    }
    // Status locked + lock still valid + different user
    return res.status(409).json({
      message: "Ghế đang được giữ bởi người khác. Vui lòng chọn ghế khác.",
      lockedUntil: seat.lockedUntil,
    });
  }

  res.json({
    ...updated.toObject(),
    lockedUntil,
    lockedAt: now,
    minutesRemaining: Math.round(LOCK_DURATION_MS / 60000),
  });
});

// DELETE /api/trip-seats/unlock/:tripSeatId
exports.unlockSeat = asyncHandler(async (req, res) => {
  const seat = await TripSeat.findById(req.params.tripSeatId);

  if (!seat) return res.status(404).json({ message: "Seat not found" });

  // Only the locker, staff, or admin can unlock
  const isOwner = seat.lockedBy?.toString() === req.user.id;
  const isPrivileged = req.user.role === "admin" || req.user.role === "staff";

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: "Cannot unlock a seat locked by another user" });
  }

  seat.status = "available";
  seat.lockedBy = null;
  seat.lockedAt = null;
  seat.lockedUntil = null;

  await seat.save();
  res.json({ message: "Seat unlocked", seatId: seat._id });
});

// GET /api/trip-seats/locked  (staff/admin)
// Returns all currently locked seats (expired locks are released first)
exports.getLockedSeats = asyncHandler(async (req, res) => {
  await releaseExpiredLocks();

  const filter = { status: "locked" };

  // Staff only see locks for their company's trips
  if (req.user.role === "staff" && req.user.busCompany?._id) {
    // Need to join through Trip to filter by busCompany
    const trips = await Trip.find({ busCompany: req.user.busCompany._id }).select("_id");
    filter.trip = { $in: trips.map(t => t._id) };
  }

  const lockedSeats = await TripSeat.find(filter)
    .populate("seat")
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation", select: "name city" },
        { path: "toStation", select: "name city" },
        { path: "bus", select: "name type licensePlate" },
      ],
    })
    .populate("lockedBy", "username email")
    .sort({ lockedUntil: 1 });

  res.json(lockedSeats);
});
