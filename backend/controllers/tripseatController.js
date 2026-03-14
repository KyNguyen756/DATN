const TripSeat = require("../models/tripSeatModel");
const Seat = require("../models/seatModel");
const Trip = require("../models/tripModel");

exports.generateTripSeats = async (req, res) => {

  const { tripId } = req.params;

  const trip = await Trip.findById(tripId).populate("bus");

  const seats = await Seat.find({
    bus: trip.bus._id
  });

  const tripSeats = seats.map(seat => ({
    trip: tripId,
    seat: seat._id,
    status: "available"
  }));

  await TripSeat.insertMany(tripSeats);

  res.json({
    message: "Trip seats generated",
    total: tripSeats.length
  });

};

exports.getTripSeats = async (req, res) => {

  const seats = await TripSeat.find({
    trip: req.params.tripId
  }).populate("seat");

  res.json(seats);

};

exports.lockSeat = async (req, res) => {

  const { tripSeatId } = req.params;

  const seat = await TripSeat.findById(tripSeatId);

  if (seat.status !== "available") {
    return res.status(400).json({
      message: "Seat not available"
    });
  }

  seat.status = "locked";
  seat.lockedBy = req.user.id;

  seat.lockedUntil = new Date(
    Date.now() + 5 * 60 * 1000
  ); // lock 5 phút

  await seat.save();

  res.json(seat);

};

exports.unlockSeat = async (req, res) => {

  const seat = await TripSeat.findById(req.params.tripSeatId);

  seat.status = "available";
  seat.lockedBy = null;
  seat.lockedUntil = null;

  await seat.save();

  res.json({
    message: "Seat unlocked"
  });

};
