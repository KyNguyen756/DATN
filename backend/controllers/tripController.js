const Trip = require("../models/tripModel");

exports.createTrip = async (req, res) => {

  try {

    const trip = await Trip.create(req.body);

    res.json(trip);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

exports.getTrips = async (req, res) => {

  const trips = await Trip.find()
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");

  res.json(trips);

};

exports.getTripById = async (req, res) => {

  const trip = await Trip.findById(req.params.id)
    .populate("fromStation")
    .populate("toStation")
    .populate("bus");

  res.json(trip);

};

exports.updateTrip = async (req, res) => {

  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(trip);

};

exports.deleteTrip = async (req, res) => {

  await Trip.findByIdAndDelete(req.params.id);

  res.json({
    message: "Trip deleted"
  });

};
