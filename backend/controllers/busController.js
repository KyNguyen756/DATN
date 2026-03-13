const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");

const toResponse = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    licensePlate: obj.busNumber || obj.licensePlate,
    seats: obj.totalSeats ?? obj.seats,
  };
};

const fromRequest = (body) => {
  const validTypes = ["seater", "sleeper", "limousine", "chair", "vip"];
  const rawType = (body.type || "").toLowerCase();
  const type = validTypes.includes(rawType) ? rawType : "seater";
  return {
    name: body.name || body.licensePlate || body.busNumber || "Bus",
    busNumber: body.busNumber || body.licensePlate || body.name,
    type,
    totalSeats: body.totalSeats ?? body.seats ?? 0,
  };
};

exports.createBus = async (req, res) => {
  try {
    const data = fromRequest(req.body);
    const bus = await Bus.create(data);
    const totalSeats = data.totalSeats || 0;
    const columns = ["A", "B"];
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      const row = Math.ceil(i / columns.length);
      const col = columns[(i - 1) % columns.length];
      seats.push({
        bus: bus._id,
        seatNumber: `${row}${col}`,
        row,
        column: col,
      });
    }
    if (seats.length > 0) await Seat.insertMany(seats);
    res.status(201).json(toResponse(bus));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses.map(toResponse));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(toResponse(bus));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.updateBus = async (req, res) => {
  try {
    const data = fromRequest(req.body);
    const bus = await Bus.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(toResponse(bus));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};
