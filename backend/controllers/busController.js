const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/buses  (admin)
exports.createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  const populated = await Bus.findById(bus._id).populate("station", "name city");
  res.status(201).json(populated);
});

// GET /api/buses  (supports ?stationId=&status=&type=)
exports.getBuses = asyncHandler(async (req, res) => {
  const { status, stationId, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (stationId) filter.station = stationId;

  const buses = await Bus.find(filter)
    .populate("station", "name city code")
    .sort({ name: 1 });
  res.json(buses);
});

// GET /api/buses/:id
exports.getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id).populate("station", "name city code");
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  res.json(bus);
});

// PUT /api/buses/:id  (admin)
exports.updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate("station", "name city code");
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  res.json(bus);
});

// DELETE /api/buses/:id  (admin)
exports.deleteBus = asyncHandler(async (req, res) => {
  const tripCount = await Trip.countDocuments({
    bus: req.params.id,
    status: { $nin: ["cancelled", "completed"] }
  });
  if (tripCount > 0) {
    return res.status(400).json({
      message: `Cannot delete bus — it is assigned to ${tripCount} active trip(s). Cancel or complete those trips first.`
    });
  }
  await Bus.findByIdAndDelete(req.params.id);
  await Seat.deleteMany({ bus: req.params.id });
  res.json({ message: "Bus deleted" });
});

// POST /api/buses/:busId/seats/generate  (admin)
exports.generateSeats = asyncHandler(async (req, res) => {
  const { busId } = req.params;
  const bus = await Bus.findById(busId);
  if (!bus) return res.status(404).json({ message: "Bus not found" });

  if (!bus.seatLayout?.rows || !bus.seatLayout?.columns) {
    return res.status(400).json({ message: "Bus seatLayout (rows/columns) not set. Update the bus first." });
  }

  const Booking = require("../models/bookingModel");
  const tripsWithBus = await Trip.find({ bus: busId }).select("_id");
  const tripIds = tripsWithBus.map(t => t._id);
  const activeBookings = await Booking.countDocuments({ trip: { $in: tripIds }, bookingStatus: "active" });
  if (activeBookings > 0) {
    return res.status(400).json({
      message: `Cannot regenerate seats — bus has ${activeBookings} active booking(s) across its trips.`
    });
  }

  await Seat.deleteMany({ bus: busId });

  const seats = [];
  for (let r = 1; r <= bus.seatLayout.rows; r++) {
    for (let c = 1; c <= bus.seatLayout.columns; c++) {
      seats.push({ bus: busId, seatNumber: `R${r}C${c}`, row: r, column: c, type: "normal" });
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
