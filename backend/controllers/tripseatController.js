const TripSeat = require("../models/tripseatModel");
const Seat = require("../models/seatModel");

exports.getSeatsByTrip = async (req, res) => {
  try {

    await TripSeat.updateMany(
      {
        reservedUntil: { $lt: new Date() },
        status: "reserved"
      },
      {
        status: "available",
        reservedBy: null,
        reservedUntil: null
      }
    );

    const seats = await TripSeat.find({
      trip: req.params.tripId
    }).populate("seat");

    res.json(seats);

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.lockSeat = async (req, res) => {
  try {
    const { tripSeatId } = req.body;
    const tripSeat = await TripSeat.findById(tripSeatId);
    if (!tripSeat) {
      return res.status(404).json({ message: "Seat not found" });
    }
    if (tripSeat.status !== "available") {
      return res.status(400).json({ message: "Seat already taken" });
    }
    tripSeat.status = "reserved";
    tripSeat.reservedBy = req.user.id;
    tripSeat.reservedUntil = new Date(Date.now() + 5 * 60 * 1000);
    await tripSeat.save();
    res.json(tripSeat);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.unlockSeat = async (req, res) => {
  try {
    const { tripSeatId } = req.body;
    const tripSeat = await TripSeat.findById(tripSeatId);
    if (!tripSeat) {
      return res.status(404).json({ message: "Seat not found" });
    }
    tripSeat.status = "available";
    tripSeat.reservedBy = null;
    tripSeat.reservedUntil = null;
    await tripSeat.save();
    res.json({ message: "Seat unlocked" });
  } catch (error) {
    res.status(500).json(error);
  }
};
