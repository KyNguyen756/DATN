const Bus = require("../models/busModel");

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

exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    res.json(bus);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(bus);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.deleteBus = async (req, res) => {

  try {

    await Bus.findByIdAndDelete(req.params.id);

    res.json("Bus deleted");

  } catch (error) {

    res.status(500).json(error);

  }

};
