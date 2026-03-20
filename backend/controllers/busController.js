const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/buses  (admin)
exports.createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  res.status(201).json(bus);
});

// GET /api/buses
exports.getBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find();
  res.json(buses);
});

// GET /api/buses/:id
exports.getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  res.json(bus);
});

// PUT /api/buses/:id  (admin)
exports.updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  res.json(bus);
});

// DELETE /api/buses/:id  (admin)
exports.deleteBus = asyncHandler(async (req, res) => {
  await Bus.findByIdAndDelete(req.params.id);
  res.json({ message: "Bus deleted" });
});

// POST /api/buses/:busId/seats/generate  (admin)
exports.generateSeats = asyncHandler(async (req, res) => {
  const { busId } = req.params;

  const bus = await Bus.findById(busId);
  if (!bus) return res.status(404).json({ message: "Bus not found" });

  if (!bus.seatLayout?.rows || !bus.seatLayout?.columns) {
    return res.status(400).json({ message: "Bus seatLayout (rows/columns) not set" });
  }

  // Remove existing seats to allow re-generation
  await Seat.deleteMany({ bus: busId });

  const seats = [];
  for (let r = 1; r <= bus.seatLayout.rows; r++) {
    for (let c = 1; c <= bus.seatLayout.columns; c++) {
      seats.push({
        bus: busId,
        seatNumber: `R${r}C${c}`,
        row: r,
        column: c,
        type: "normal"
      });
    }
  }

  await Seat.insertMany(seats);
  res.json({ message: "Seats generated", total: seats.length });
});

// GET /api/buses/:busId/seats
exports.getSeats = asyncHandler(async (req, res) => {
  const seats = await Seat.find({ bus: req.params.busId }).sort({ row: 1, column: 1 });
  res.json(seats);
});
