const Trip = require("../models/tripModel");
const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");
const TripSeat = require("../models/tripseatModel");

exports.createTrip = async (req, res) => {
  try {

    const { bus } = req.body;

    // lấy bus
    const busData = await Bus.findById(bus);
    if (!busData) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // tạo trip
    const trip = await Trip.create({
      ...req.body,
      availableSeats: busData.totalSeats
    });

    // lấy seat của bus
    const seats = await Seat.find({ bus: bus });

    // tạo tripSeat
    const tripSeats = seats.map(seat => ({
      trip: trip._id,
      seat: seat._id,
      status: "available"
    }));

    await TripSeat.insertMany(tripSeats);

    res.status(201).json(trip);

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("bus");
    res.json(trips);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("bus");
    res.json(trip);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(trip);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json("Trip deleted");
  } catch (error) {
    res.status(500).json(error);
  }
};
