const TripSeat = require("../models/tripseatModel");
const Seat = require("../models/seatModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

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
  // Auto-release any expired locks before returning
  await TripSeat.updateMany(
    {
      trip: req.params.tripId,
      status: "locked",
      lockedUntil: { $lt: new Date() }
    },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  const seats = await TripSeat.find({ trip: req.params.tripId }).populate("seat");
  res.json(seats);
});

// GET /api/trip-seats/:tripId/count
exports.getSeatCount = asyncHandler(async (req, res) => {
  // Release expired locks first
  await TripSeat.updateMany(
    {
      trip: req.params.tripId,
      status: "locked",
      lockedUntil: { $lt: new Date() }
    },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  const available = await TripSeat.countDocuments({
    trip: req.params.tripId,
    status: "available"
  });

  const booked = await TripSeat.countDocuments({
    trip: req.params.tripId,
    status: "booked"
  });

  const locked = await TripSeat.countDocuments({
    trip: req.params.tripId,
    status: "locked"
  });

  res.json({ available, booked, locked, total: available + booked + locked });
});

// POST /api/trip-seats/lock/:tripSeatId
exports.lockSeat = asyncHandler(async (req, res) => {
  const { tripSeatId } = req.params;

  const seat = await TripSeat.findById(tripSeatId);
  if (!seat) return res.status(404).json({ message: "Seat not found" });

  // Release if previously locked by THIS user (re-lock resets timer)
  const expiredByUser = seat.status === "locked" && seat.lockedBy?.toString() === req.user.id;
  if (seat.status === "locked" && !expiredByUser) {
    // Check if lock has expired
    if (seat.lockedUntil > new Date()) {
      return res.status(400).json({ message: "Seat is already locked by another user" });
    }
  }

  if (seat.status === "booked") {
    return res.status(400).json({ message: "Seat is already booked" });
  }

  seat.status = "locked";
  seat.lockedBy = req.user.id;
  seat.lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await seat.save();
  res.json(seat);
});

// DELETE /api/trip-seats/unlock/:tripSeatId
exports.unlockSeat = asyncHandler(async (req, res) => {
  const seat = await TripSeat.findById(req.params.tripSeatId);

  if (!seat) return res.status(404).json({ message: "Seat not found" });

  // Only the locker or admin can unlock
  if (seat.lockedBy?.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Cannot unlock a seat locked by another user" });
  }

  seat.status = "available";
  seat.lockedBy = null;
  seat.lockedUntil = null;

  await seat.save();
  res.json({ message: "Seat unlocked" });
});

// GET /api/trip-seats/locked  (staff/admin)
exports.getLockedSeats = asyncHandler(async (req, res) => {
  // Auto-release expired locks first
  await TripSeat.updateMany(
    { status: "locked", lockedUntil: { $lt: new Date() } },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  const lockedSeats = await TripSeat.find({ status: "locked" })
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
