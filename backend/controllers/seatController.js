const Seat = require("../models/seatModel");

exports.getSeatsByBus = async (req, res) => {
  try {
    const seats = await Seat.find({
      bus: req.params.busId
    });
    res.json(seats);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(seat);
  } catch (error) {
    res.status(500).json(error);
  }

};

exports.deleteSeat = async (req, res) => {
  try {
    await Seat.findByIdAndDelete(req.params.id);
    res.json("Seat deleted");
  } catch (error) {
    res.status(500).json(error);
  }
};
