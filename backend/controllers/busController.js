const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");

exports.createBus = async (req, res) => {

  try {

    const bus = await Bus.create(req.body);

    res.json(bus);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.getBuses = async (req, res) => {

  const buses = await Bus.find();

  res.json(buses);

};

exports.getBusById = async (req, res) => {

  const bus = await Bus.findById(req.params.id);

  res.json(bus);

};

exports.updateBus = async (req, res) => {

  const bus = await Bus.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(bus);

};

exports.deleteBus = async (req, res) => {

  await Bus.findByIdAndDelete(req.params.id);

  res.json({
    message: "Bus deleted"
  });

};

exports.generateSeats = async (req, res) => {

  const { busId } = req.params;

  const bus = await Bus.findById(busId);

  const seats = [];

  for (let r = 1; r <= bus.seatLayout.rows; r++) {

    for (let c = 1; c <= bus.seatLayout.columns; c++) {

      seats.push({
        bus: busId,
        seatNumber: `R${r}C${c}`,
        row: r,
        column: c
      });

    }

  }

  await Seat.insertMany(seats);

  res.json({
    message: "Seats generated",
    total: seats.length
  });

};

exports.getSeats = async (req, res) => {

  const seats = await Seat.find({
    bus: req.params.busId
  });

  res.json(seats);

};

