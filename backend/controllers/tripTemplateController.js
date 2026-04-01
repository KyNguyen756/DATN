const TripTemplate = require("../models/tripTemplateModel");
const Trip         = require("../models/tripModel");
const Seat         = require("../models/seatModel");
const TripSeat     = require("../models/tripseatModel");
const asyncHandler = require("../utils/asyncHandler");
const { userBelongsToCompany } = require("../middleware/busCompanyMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// Shared populate config
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_POPULATE = [
  { path: "busCompany",  select: "name shortName code logo" },
  { path: "fromStation", select: "name city address" },
  { path: "toStation",   select: "name city address" },
  { path: "bus",         select: "name licensePlate type totalSeats driver" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: company-scoped filter (mirrors busController pattern)
// ─────────────────────────────────────────────────────────────────────────────
const companyFilter = (user) => {
  if (!user || user.role === "admin") return {};
  if (user.role === "staff" && user.busCompany?._id) {
    return { busCompany: user.busCompany._id };
  }
  return {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build a departureTime Date from targetDate (string "YYYY-MM-DD") +
//         hour/minute in UTC+7, then store as UTC in MongoDB.
//
//   UTC+7 offset = 7 * 60 * 60 * 1000 ms
//   departureTime (UTC) = localMidnight - 7h_offset + hour*3600s + minute*60s
// ─────────────────────────────────────────────────────────────────────────────
const buildDepartureTime = (targetDate, hour, minute) => {
  // Interpret targetDate as local Vietnam date (UTC+7)
  const [year, month, day] = targetDate.split("-").map(Number);
  // Date.UTC treats as UTC midnight; subtract UTC+7 offset to get Vietnam midnight as UTC
  const localMidnightUTC = Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000;
  const ms = localMidnightUTC + (hour * 3600 + minute * 60) * 1000;
  return new Date(ms);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Create TripSeats for all seats on a bus → returns count
// ─────────────────────────────────────────────────────────────────────────────
const createTripSeats = async (tripId, busId) => {
  const seats = await Seat.find({ bus: busId }).select("_id");
  if (!seats.length) return 0;
  const docs = seats.map(s => ({ trip: tripId, seat: s._id, status: "available" }));
  await TripSeat.insertMany(docs, { ordered: false });
  return docs.length;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trip-templates
// Admin → all | Staff → own company only
// Query: ?status=, ?fromStation=, ?toStation=, ?page=, ?limit=
// ─────────────────────────────────────────────────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
  const { status, fromStation, toStation, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = companyFilter(req.user);
  if (status) filter.status = status;
  if (fromStation) filter.fromStation = fromStation;
  if (toStation)   filter.toStation   = toStation;

  const [templates, total] = await Promise.all([
    TripTemplate.find(filter)
      .populate(TEMPLATE_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    TripTemplate.countDocuments(filter),
  ]);

  res.json({
    templates,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trip-templates/:id
// ─────────────────────────────────────────────────────────────────────────────
exports.getById = asyncHandler(async (req, res) => {
  const template = await TripTemplate.findById(req.params.id).populate(TEMPLATE_POPULATE);
  if (!template) return res.status(404).json({ message: "Template không tồn tại" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, template.busCompany)) {
    return res.status(403).json({ message: "Không có quyền xem template này" });
  }
  res.json(template);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trip-templates
// Staff: busCompany auto-set | Admin: busCompany từ body
// ─────────────────────────────────────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Validate fromStation ≠ toStation
  if (data.fromStation && data.toStation && data.fromStation === data.toStation) {
    return res.status(400).json({ message: "Bến đi và bến đến không được giống nhau" });
  }

  // Auto-set busCompany for staff
  if (req.user.role === "staff") {
    if (!req.user.busCompany?._id) {
      return res.status(403).json({ message: "Nhân viên chưa được gán vào nhà xe" });
    }
    data.busCompany = req.user.busCompany._id;
  }

  const template = await TripTemplate.create(data);
  const populated = await TripTemplate.findById(template._id).populate(TEMPLATE_POPULATE);
  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/trip-templates/:id
// Staff: can only edit own-company templates, cannot reassign busCompany
// ─────────────────────────────────────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
  const template = await TripTemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ message: "Template không tồn tại" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, template.busCompany)) {
    return res.status(403).json({ message: "Không có quyền sửa template này" });
  }

  const updates = { ...req.body };
  if (req.user.role === "staff") delete updates.busCompany;

  // Validate fromStation ≠ toStation if both are being updated
  const newFrom = updates.fromStation || template.fromStation.toString();
  const newTo   = updates.toStation   || template.toStation.toString();
  if (newFrom === newTo) {
    return res.status(400).json({ message: "Bến đi và bến đến không được giống nhau" });
  }

  const updated = await TripTemplate.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  }).populate(TEMPLATE_POPULATE);

  res.json(updated);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/trip-templates/:id
// Admin only, or staff of same company (checked via route middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.remove = asyncHandler(async (req, res) => {
  const template = await TripTemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ message: "Template không tồn tại" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, template.busCompany)) {
    return res.status(403).json({ message: "Không có quyền xóa template này" });
  }

  await template.deleteOne();
  res.json({ message: "Đã xóa template thành công" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trip-templates/:id/generate
// Tạo 1 TripInstance từ template cho ngày cụ thể.
//
// Body:
//   targetDate     {string}  "YYYY-MM-DD"  (bắt buộc)
//   bus            {ObjectId} override xe      (optional)
//   price          {Number}   override giá     (optional)
//   departureTime  {string}   ISOString override giờ     (optional)
// ─────────────────────────────────────────────────────────────────────────────
exports.generate = asyncHandler(async (req, res) => {
  const template = await TripTemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ message: "Template không tồn tại" });

  // RBAC
  if (req.user.role === "staff" && !userBelongsToCompany(req.user, template.busCompany)) {
    return res.status(403).json({ message: "Không có quyền tạo chuyến từ template này" });
  }
  if (template.status !== "active") {
    return res.status(400).json({ message: "Template không còn hoạt động" });
  }

  const { targetDate, bus, price, departureTime: deptOverride } = req.body;
  if (!targetDate) return res.status(400).json({ message: "targetDate là bắt buộc (YYYY-MM-DD)" });

  // ── Xác định xe ──────────────────────────────────────────────────────────
  const resolvedBus = bus || template.bus;
  if (!resolvedBus) {
    return res.status(400).json({
      message: "Template chưa có xe mặc định. Vui lòng chỉ định xe (bus) khi generate.",
    });
  }

  // ── Xác định giờ xuất phát ───────────────────────────────────────────────
  let departureTime;
  if (deptOverride) {
    departureTime = new Date(deptOverride);
    if (isNaN(departureTime.getTime())) {
      return res.status(400).json({ message: "departureTime không hợp lệ" });
    }
  } else {
    departureTime = buildDepartureTime(targetDate, template.departureHour, template.departureMinute);
  }

  // ── Tính giờ đến ─────────────────────────────────────────────────────────
  const arrivalTime = template.estimatedDuration > 0
    ? new Date(departureTime.getTime() + template.estimatedDuration * 60 * 1000)
    : undefined;

  // ── Tạo Trip ─────────────────────────────────────────────────────────────
  let trip;
  try {
    trip = await Trip.create({
      template:            template._id,
      tripDate:            new Date(targetDate),
      actualDepartureTime: departureTime,
      busCompany:          template.busCompany,
      fromStation:         template.fromStation,
      toStation:           template.toStation,
      bus:                 resolvedBus,
      departureTime,
      arrivalTime,
      estimatedDuration:   template.estimatedDuration,
      price:               price ?? template.price,
      cancellationPolicy:  template.cancellationPolicy,
      status:              "active",
    });
  } catch (err) {
    // MongoDB duplicate key error code = 11000
    if (err.code === 11000) {
      return res.status(409).json({
        message: `Chuyến này đã tồn tại cho ngày ${targetDate} từ template này`,
      });
    }
    throw err;
  }

  // ── Tạo TripSeat cho tất cả ghế của xe ───────────────────────────────────
  const seatsCreated = await createTripSeats(trip._id, resolvedBus);

  // ── Populate và trả về ───────────────────────────────────────────────────
  const populated = await Trip.findById(trip._id).populate([
    { path: "template",    select: "name" },
    { path: "busCompany",  select: "name shortName code" },
    { path: "fromStation", select: "name city" },
    { path: "toStation",   select: "name city" },
    { path: "bus",         select: "name licensePlate type totalSeats" },
  ]);

  res.status(201).json({ trip: populated, seatsCreated });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/trip-templates/:id/bulk-generate
// Tạo nhiều TripInstance theo range ngày.
//
// Body:
//   fromDate  {string}  "YYYY-MM-DD"  (bắt buộc)
//   toDate    {string}  "YYYY-MM-DD"  (bắt buộc)
//   bus       {ObjectId}              (optional override)
//   price     {Number}                (optional override)
//
// Max range: 30 ngày.
// Ngày trùng (duplicate) → bỏ qua, không throw error.
// Filter ngày theo template.daysOfWeek (nếu rỗng → generate tất cả ngày).
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkGenerate = asyncHandler(async (req, res) => {
  const template = await TripTemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ message: "Template không tồn tại" });

  if (req.user.role === "staff" && !userBelongsToCompany(req.user, template.busCompany)) {
    return res.status(403).json({ message: "Không có quyền tạo chuyến từ template này" });
  }
  if (template.status !== "active") {
    return res.status(400).json({ message: "Template không còn hoạt động" });
  }

  const { fromDate, toDate, bus, price } = req.body;
  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "fromDate và toDate là bắt buộc (YYYY-MM-DD)" });
  }

  const resolvedBus = bus || template.bus;
  if (!resolvedBus) {
    return res.status(400).json({
      message: "Template chưa có xe mặc định. Vui lòng chỉ định xe (bus) khi generate.",
    });
  }

  // ── Validate range ────────────────────────────────────────────────────────
  const from = new Date(fromDate);
  const to   = new Date(toDate);
  if (isNaN(from) || isNaN(to) || from > to) {
    return res.status(400).json({ message: "fromDate và toDate không hợp lệ" });
  }
  const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 30) {
    return res.status(400).json({ message: "Range tối đa là 30 ngày" });
  }

  // ── Tạo danh sách ngày cần generate ──────────────────────────────────────
  const targetDates = [];
  const cur = new Date(from);
  while (cur <= to) {
    const dayOfWeek = cur.getUTCDay(); // 0=CN, 1=T2 ... 6=T7
    // Nếu daysOfWeek trống → generate tất cả ngày trong range
    if (!template.daysOfWeek.length || template.daysOfWeek.includes(dayOfWeek)) {
      targetDates.push(cur.toISOString().slice(0, 10)); // "YYYY-MM-DD"
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  if (!targetDates.length) {
    return res.status(400).json({
      message: "Không có ngày nào trong range phù hợp với daysOfWeek của template",
    });
  }

  // ── Generate từng ngày ────────────────────────────────────────────────────
  const created = [];
  const skipped = [];
  const errors  = [];

  for (const dateStr of targetDates) {
    const departureTime = buildDepartureTime(dateStr, template.departureHour, template.departureMinute);
    const arrivalTime   = template.estimatedDuration > 0
      ? new Date(departureTime.getTime() + template.estimatedDuration * 60 * 1000)
      : undefined;

    try {
      const trip = await Trip.create({
        template:            template._id,
        tripDate:            new Date(dateStr),
        actualDepartureTime: departureTime,
        busCompany:          template.busCompany,
        fromStation:         template.fromStation,
        toStation:           template.toStation,
        bus:                 resolvedBus,
        departureTime,
        arrivalTime,
        estimatedDuration:   template.estimatedDuration,
        price:               price ?? template.price,
        cancellationPolicy:  template.cancellationPolicy,
        status:              "active",
      });

      await createTripSeats(trip._id, resolvedBus);
      created.push({ date: dateStr, tripId: trip._id });

    } catch (err) {
      if (err.code === 11000) {
        skipped.push(dateStr); // duplicate → bỏ qua
      } else {
        errors.push({ date: dateStr, error: err.message });
      }
    }
  }

  res.status(201).json({
    message: `Bulk generate hoàn thành: ${created.length} tạo mới, ${skipped.length} bỏ qua (trùng), ${errors.length} lỗi`,
    created,
    skipped,
    errors,
    summary: {
      totalDates:  targetDates.length,
      createdCount: created.length,
      skippedCount: skipped.length,
      errorCount:   errors.length,
    },
  });
});
