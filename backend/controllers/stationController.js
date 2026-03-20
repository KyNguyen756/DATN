const Station = require("../models/stationModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/stations
exports.createStation = asyncHandler(async (req, res) => {
  const station = await Station.create(req.body);
  res.status(201).json(station);
});

// GET /api/stations
exports.getStations = asyncHandler(async (req, res) => {
  const stations = await Station.find({ status: "active" });
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
  const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!station) return res.status(404).json({ message: "Station not found" });
  res.json(station);
});

// DELETE /api/stations/:id  (admin)
exports.deleteStation = asyncHandler(async (req, res) => {
  await Station.findByIdAndDelete(req.params.id);
  res.json({ message: "Station deleted" });
});
