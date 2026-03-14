const Station = require("../models/stationModel");

exports.createStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStations = async (req, res) => {
  const stations = await Station.find();
  res.json(stations);
};


exports.getStationById = async (req, res) => {
  const station = await Station.findById(req.params.id);
  res.json(station);
};

exports.updateStation = async (req, res) => {
  const station = await Station.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(station);
};

exports.deleteStation = async (req, res) => {
  await Station.findByIdAndDelete(req.params.id);
  res.json({
    message: "Station deleted"
  });
};
