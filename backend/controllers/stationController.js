const Station = require("../models/stationModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/stations
exports.createStation = asyncHandler(async (req, res) => {
  const station = await Station.create(req.body);
  res.status(201).json(station);
});

// GET /api/stations
exports.getStations = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = includeInactive ? {} : { status: "active" };
  const stations = await Station.find(filter).sort({ city: 1, name: 1 });
  res.json(stations);
});

// GET /api/stations/cities  — list of distinct city names
exports.getCities = asyncHandler(async (req, res) => {
  const cities = await Station.distinct("city", { status: "active" });
  cities.sort();
  res.json(cities);
});

// GET /api/stations/:id
exports.getStationById = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);
  if (!station) return res.status(404).json({ message: "Station not found" });
  res.json(station);
});

// PUT /api/stations/:id  (admin)
exports.updateStation = asyncHandler(async (req, res) => {
  const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!station) return res.status(404).json({ message: "Station not found" });
  res.json(station);
});

// DELETE /api/stations/:id  (admin)
exports.deleteStation = asyncHandler(async (req, res) => {
  // Safety: do not delete if active trips reference this station
  const tripCount = await Trip.countDocuments({
    $or: [{ fromStation: req.params.id }, { toStation: req.params.id }],
    status: { $nin: ["cancelled", "completed"] }
  });

  if (tripCount > 0) {
    return res.status(400).json({
      message: `Cannot delete station — it is used in ${tripCount} active trip(s). Cancel or complete those trips first.`
    });
  }

  await Station.findByIdAndDelete(req.params.id);
  res.json({ message: "Station deleted" });
});
