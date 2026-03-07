const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");

exports.createBus = async (req, res) => {

  try {

    const { name, busNumber, totalSeats } = req.body;

    const bus = await Bus.create({
      name,
      busNumber,
      totalSeats
    });

    // tạo ghế tự động
    const seats = [];

    const columns = ["A", "B"];

    for (let i = 1; i <= totalSeats; i++) {

      const row = Math.ceil(i / columns.length);
      const column = columns[(i - 1) % columns.length];

      seats.push({
        bus: bus._id,
        seatNumber: `${row}${column}`,
        row: row,
        column: column
      });

    }

    await Seat.insertMany(seats);

    res.status(201).json({
      bus,
      seatsCreated: seats.length
    });

  } catch (error) {

    res.status(500).json(error);

  }

};

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
