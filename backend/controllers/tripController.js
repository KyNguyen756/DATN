const Trip = require("../models/tripModel");
const Station = require("../models/stationModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/trips  (admin)
exports.createTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.create(req.body);
  res.status(201).json(trip);
});

// GET /api/trips  (all)
exports.getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ status: "active" })
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");
  res.json(trips);
});

// GET /api/trips/search?from=<city>&to=<city>&date=<YYYY-MM-DD>&type=<bus.type>
exports.searchTrips = asyncHandler(async (req, res) => {
  const { from, to, date, type } = req.query;

  // Build station filter by city name (case-insensitive)
  const fromFilter = from
    ? { city: { $regex: from, $options: "i" } }
    : {};
  const toFilter = to
    ? { city: { $regex: to, $options: "i" } }
    : {};

  const [fromStations, toStations] = await Promise.all([
    Station.find(fromFilter).select("_id"),
    Station.find(toFilter).select("_id")
  ]);

  const tripFilter = { status: "active" };

  if (from && fromStations.length > 0) {
    tripFilter.fromStation = { $in: fromStations.map(s => s._id) };
  }
  if (to && toStations.length > 0) {
    tripFilter.toStation = { $in: toStations.map(s => s._id) };
  }

  // Filter by departure date (same calendar day)
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    tripFilter.departureTime = { $gte: start, $lt: end };
  }

  let trips = await Trip.find(tripFilter)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus")
    .sort({ departureTime: 1 });

  // Filter by bus type if provided
  if (type && type !== "Tất cả") {
    trips = trips.filter(t => t.bus && t.bus.type === type);
  }

  res.json(trips);
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
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });
  res.json({ message: "Trip deleted" });
});
