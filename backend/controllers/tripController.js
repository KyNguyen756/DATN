const Trip = require("../models/tripModel");
const Station = require("../models/stationModel");
const asyncHandler = require("../utils/asyncHandler");
const { userBelongsToCompany } = require("../middleware/busCompanyMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build a busCompany filter based on role.
//   - admin  → {} (sees all)
//   - staff  → { busCompany: req.user.busCompany._id }
//   - no user → {} (public endpoints like /search)
// ─────────────────────────────────────────────────────────────────────────────
const companyFilter = (user) => {
  if (!user) return {};
  if (user.role === "admin") return {};
  if (user.role === "staff" && user.busCompany?._id) {
    return { busCompany: user.busCompany._id };
  }
  return {};
};

const TRIP_POPULATE = [
  { path: "fromStation", select: "name city address" },
  { path: "toStation",   select: "name city address" },
  { path: "bus",         select: "name licensePlate type totalSeats driver driverPhone busCompany" },
  { path: "busCompany",  select: "name shortName code logo" },
  { path: "template",   select: "name departureHour departureMinute daysOfWeek" },
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trips  (staff or admin)
// Staff: busCompany is auto-set to their own company.
// ─────────────────────────────────────────────────────────────────────────────
exports.createTrip = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (req.user.role === "staff") {
    if (!req.user.busCompany?._id) {
      return res.status(403).json({ message: "Staff not assigned to any bus company" });
    }
    data.busCompany = req.user.busCompany._id;
  }

  const trip = await Trip.create(data);
  const populated = await Trip.findById(trip._id).populate(TRIP_POPULATE);
  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trips  (auth required: staff/admin management list)
// Staff see only their company's trips; admin sees all.
// Supports: ?status=active|cancelled, ?page, ?limit, ?from, ?to
// ─────────────────────────────────────────────────────────────────────────────
exports.getTrips = asyncHandler(async (req, res) => {
  const {
    status, page = 1, limit = 50,
    from, to,
    fromStation, toStation,   // accept direct ObjectId filters (counter sale)
    date,                      // YYYY-MM-DD — filter by departure date (UTC+7)
    template, hasTemplate
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const filter = companyFilter(req.user);
  if (status) filter.status = status;

  // Feature 2: filter by template ref
  if (template) {
    filter.template = template;
  } else if (hasTemplate === "true") {
    filter.template = { $ne: null };
  } else if (hasTemplate === "false") {
    filter.template = null;
  }

  // Feature 3: date filter (Counter Sale — UTC+7 day boundary)
  if (date) {
    // Convert YYYY-MM-DD (Vietnam local) to UTC range
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d) - 7 * 60 * 60 * 1000); // 00:00 UTC+7 → subtract 7h for UTC
    const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    filter.departureTime = { $gte: start, $lt: end };
  }

  // Direct ObjectId station filter (counter sale sends station IDs)
  if (fromStation) filter.fromStation = fromStation;
  if (toStation)   filter.toStation   = toStation;

  // City-name from/to filter (RoutesPage uses city string search)
  if ((from || to) && !fromStation && !toStation) {
    const [fromStations, toStations] = await Promise.all([
      from ? Station.find({ city: { $regex: from, $options: "i" } }).select("_id") : [],
      to   ? Station.find({ city: { $regex: to,   $options: "i" } }).select("_id") : []
    ]);
    if (from && fromStations.length > 0) filter.fromStation = { $in: fromStations.map(s => s._id) };
    if (to   && toStations.length   > 0) filter.toStation   = { $in: toStations.map(s => s._id) };
  }

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate(TRIP_POPULATE)
      .sort({ departureTime: 1 })  // ascending — counter staff sees next departures first
      .skip(skip)
      .limit(Number(limit)),
    Trip.countDocuments(filter)
  ]);

  res.json({
    trips,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trips/search  (PUBLIC — customer-facing trip search)
// No company filtering — customers see all active trips across all companies.
// Supports: ?from=<city>, ?to=<city>, ?date=<YYYY-MM-DD>, ?type=<bus.type>
// ─────────────────────────────────────────────────────────────────────────────
exports.searchTrips = asyncHandler(async (req, res) => {
  const { from, to, date, type } = req.query;

  const fromFilter = from ? { city: { $regex: from, $options: "i" } } : {};
  const toFilter   = to   ? { city: { $regex: to,   $options: "i" } } : {};

  const [fromStations, toStations] = await Promise.all([
    Station.find(fromFilter).select("_id"),
    Station.find(toFilter).select("_id")
  ]);

  const tripFilter = { status: "active" };

  if (from && fromStations.length > 0) {
    tripFilter.fromStation = { $in: fromStations.map(s => s._id) };
  }
  if (to && toStations.length > 0) {
    tripFilter.toStation = { $in: toStations.map(s => s._id) };
  }
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    tripFilter.departureTime = { $gte: start, $lt: end };
  }

  let trips = await Trip.find(tripFilter)
    .populate(TRIP_POPULATE)
    .sort({ departureTime: 1 });

  // Post-filter by bus type if provided
  if (type && type !== "Tất cả") {
    trips = trips.filter(t => t.bus && t.bus.type === type);
  }

  res.json(trips);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trips/:id  (PUBLIC)
// ─────────────────────────────────────────────────────────────────────────────
exports.getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate(TRIP_POPULATE);
  if (!trip) return res.status(404).json({ message: "Trip not found" });
  res.json(trip);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/trips/:id  (staff or admin)
// Staff: can only update trips in their own company; cannot change busCompany.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, trip.busCompany)) {
    return res.status(403).json({ message: "Access denied: trip belongs to a different company" });
  }

  const updates = { ...req.body };
  if (req.user.role === "staff") delete updates.busCompany; // staff cannot reassign

  const updated = await Trip.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate(TRIP_POPULATE);

  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/trips/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });
  res.json({ message: "Trip deleted" });
});
