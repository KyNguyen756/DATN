const Trip = require("../models/tripModel");
const TripSeat = require("../models/tripseatModel");
const Station = require("../models/stationModel");
const asyncHandler = require("../utils/asyncHandler");

// Helper: auto-release expired locks for a set of trip IDs and return available counts
async function enrichWithSeatCounts(trips) {
  if (trips.length === 0) return trips;

  const tripIds = trips.map(t => t._id);

  // Release all expired locks for these trips in one query
  await TripSeat.updateMany(
    { trip: { $in: tripIds }, status: "locked", lockedUntil: { $lt: new Date() } },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  // Aggregate available seat counts for all trips in one query (instead of N+1)
  const counts = await TripSeat.aggregate([
    { $match: { trip: { $in: tripIds }, status: "available" } },
    { $group: { _id: "$trip", available: { $sum: 1 } } }
  ]);

  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.available; });

  return trips.map(t => ({
    ...t.toObject(),
    availableSeats: countMap[t._id.toString()] ?? 0
  }));
}

// POST /api/trips  (admin)
exports.createTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.create(req.body);

  // Auto-generate TripSeats if the bus exists and already has seats
  try {
    const Seat = require("../models/seatModel");
    const busSeats = await Seat.find({ bus: trip.bus });
    if (busSeats.length > 0) {
      const tripSeats = busSeats.map(seat => ({ trip: trip._id, seat: seat._id, status: "available" }));
      await TripSeat.insertMany(tripSeats);
    }
  } catch (_) {
    // Non-fatal: admin can still manually generate seats via the generate endpoint
  }

  const populated = await Trip.findById(trip._id)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");

  res.status(201).json(populated);
});

// GET /api/trips  (all — with pagination)
exports.getTrips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const filter = status ? { status } : { status: { $ne: "cancelled" } };

  const trips = await Trip.find(filter)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus")
    .sort({ departureTime: 1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Trip.countDocuments(filter);
  const enriched = await enrichWithSeatCounts(trips);

  res.json({ trips: enriched, total, page: Number(page), limit: Number(limit) });
});

// GET /api/trips/search?from=<city>&to=<city>&date=<YYYY-MM-DD>&type=<bus.type>
exports.searchTrips = asyncHandler(async (req, res) => {
  const { from, to, date, type } = req.query;

  const fromFilter = from ? { city: { $regex: from, $options: "i" } } : {};
  const toFilter   = to   ? { city: { $regex: to,   $options: "i" } } : {};

  const [fromStations, toStations] = await Promise.all([
    Station.find(fromFilter).select("_id"),
    Station.find(toFilter).select("_id")
  ]);

  const tripFilter = { status: { $in: ["scheduled", "active", "ongoing"] } };

  if (from && fromStations.length > 0) {
    tripFilter.fromStation = { $in: fromStations.map(s => s._id) };
  }
  if (to && toStations.length > 0) {
    tripFilter.toStation = { $in: toStations.map(s => s._id) };
  }

  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    tripFilter.departureTime = { $gte: start, $lt: end };
  }

  let trips = await Trip.find(tripFilter)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus")
    .sort({ departureTime: 1 });

  // Client-side bus type filter (post-populate)
  if (type && type !== "Tất cả") {
    trips = trips.filter(t => t.bus && t.bus.type === type);
  }

  // Enrich with availableSeats (single aggregate — no N+1)
  const enriched = await enrichWithSeatCounts(trips);

  res.json(enriched);
});

// GET /api/trips/:id
exports.getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");

  if (!trip) return res.status(404).json({ message: "Trip not found" });
  res.json(trip);
});

// PUT /api/trips/:id  (admin)
exports.updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");

  if (!trip) return res.status(404).json({ message: "Trip not found" });
  res.json(trip);
});

// DELETE /api/trips/:id  (admin)
exports.deleteTrip = asyncHandler(async (req, res) => {
  const Booking = require("../models/bookingModel");
  const activeBookings = await Booking.countDocuments({ trip: req.params.id, bookingStatus: "active" });
  if (activeBookings > 0) {
    return res.status(400).json({ message: `Cannot delete trip — it has ${activeBookings} active booking(s)` });
  }

  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  // Clean up orphaned TripSeats
  await TripSeat.deleteMany({ trip: req.params.id });

  res.json({ message: "Trip deleted" });
});
