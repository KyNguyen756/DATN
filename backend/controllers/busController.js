const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");
const asyncHandler = require("../utils/asyncHandler");
const { userBelongsToCompany } = require("../middleware/busCompanyMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build a busCompany filter based on requesting user's role.
//   - admin → no company filter (sees everything)
//   - staff → { busCompany: req.user.busCompany._id }
//   - unauthenticated / user → public facing; no filter (buses are public info)
// ─────────────────────────────────────────────────────────────────────────────
const companyFilter = (user) => {
  if (!user) return {};
  if (user.role === "admin") return {};
  if (user.role === "staff" && user.busCompany?._id) {
    return { busCompany: user.busCompany._id };
  }
  return {};
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/buses  (staff or admin)
// Staff: busCompany is auto-set to their own company.
// Admin: busCompany must be provided in body, or will remain null.
// ─────────────────────────────────────────────────────────────────────────────
exports.createBus = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (req.user.role === "staff") {
    if (!req.user.busCompany?._id) {
      return res.status(403).json({ message: "Staff not assigned to any bus company" });
    }
    // Force busCompany to staff's own company regardless of body
    data.busCompany = req.user.busCompany._id;
  }
  // Admin can pass busCompany in body or leave null

  const bus = await Bus.create(data);
  const populated = await bus.populate("busCompany", "name shortName code");
  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/buses  (auth required: staff/admin)
// Staff see only their company's buses; admin sees all.
// Supports: ?search=<name|plate>, ?status=active|inactive, ?page, ?limit
// ─────────────────────────────────────────────────────────────────────────────
exports.getBuses = asyncHandler(async (req, res) => {
  const { search = "", status, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = companyFilter(req.user);

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { licensePlate: { $regex: search, $options: "i" } }
    ];
  }
  if (status) filter.status = status;

  const [buses, total] = await Promise.all([
    Bus.find(filter)
      .populate("busCompany", "name shortName code logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Bus.countDocuments(filter)
  ]);

  res.json({
    buses,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/buses/:id  (auth required)
// Staff can only view buses in their own company.
// ─────────────────────────────────────────────────────────────────────────────
exports.getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id)
    .populate("busCompany", "name shortName code logo");

  if (!bus) return res.status(404).json({ message: "Bus not found" });

  // RBAC: staff can only view buses of their own company
  if (req.user.role === "staff" && !userBelongsToCompany(req.user, bus.busCompany?._id)) {
    return res.status(403).json({ message: "Access denied: bus belongs to a different company" });
  }

  res.json(bus);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/buses/:id  (staff or admin)
// Staff: can only update buses in their own company; cannot change busCompany.
// Admin: full update.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, bus.busCompany?._id)) {
    return res.status(403).json({ message: "Access denied: bus belongs to a different company" });
  }

  const updates = { ...req.body };

  // Staff cannot change a bus's company assignment
  if (req.user.role === "staff") {
    delete updates.busCompany;
  }

  const updated = await Bus.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate("busCompany", "name shortName code");

  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/buses/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndDelete(req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  res.json({ message: "Bus deleted" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/buses/:busId/generate-seats  (staff or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.generateSeats = asyncHandler(async (req, res) => {
  const { busId } = req.params;
  const bus = await Bus.findById(busId);
  if (!bus) return res.status(404).json({ message: "Bus not found" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, bus.busCompany?._id)) {
    return res.status(403).json({ message: "Access denied: bus belongs to a different company" });
  }

  if (!bus.seatLayout?.rows || !bus.seatLayout?.columns) {
    return res.status(400).json({ message: "Bus seatLayout (rows/columns) not set" });
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/buses/:busId/seats  (auth required)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSeats = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.busId);
  if (!bus) return res.status(404).json({ message: "Bus not found" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, bus.busCompany?._id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const seats = await Seat.find({ bus: req.params.busId }).sort({ row: 1, column: 1 });
  res.json(seats);
});
