const BusCompany = require("../models/busCompanyModel");
const Station = require("../models/stationModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { userBelongsToCompany } = require("../middleware/busCompanyMiddleware");

// ─────────────────────────────────────────────
// GET /api/bus-companies
// Admin: full list with pagination + search
// Staff: returns only their own company (as a single-item list)
// ─────────────────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
  // Staff can only see their own company
  if (req.user.role === "staff") {
    if (!req.user.busCompany?._id) {
      return res.json({ companies: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } });
    }
    const company = await BusCompany.findById(req.user.busCompany._id)
      .populate("stations", "name city address");
    return res.json({
      companies: company ? [company] : [],
      pagination: { total: company ? 1 : 0, page: 1, limit: 1, totalPages: company ? 1 : 0 }
    });
  }

  // Admin: full paginated list with optional search/status filter
  const { page = 1, limit = 20, search = "", status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { name:      { $regex: search, $options: "i" } },
      { shortName: { $regex: search, $options: "i" } },
      { code:      { $regex: search.toUpperCase(), $options: "i" } }
    ];
  }
  if (status) filter.status = status;

  const [companies, total] = await Promise.all([
    BusCompany.find(filter)
      .populate("stations", "name city address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    BusCompany.countDocuments(filter)
  ]);

  res.json({
    companies,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/bus-companies/:id
// Admin: any company | Staff: only their own
// ─────────────────────────────────────────────
exports.getById = asyncHandler(async (req, res) => {
  const company = await BusCompany.findById(req.params.id)
    .populate("stations", "name city address type status");

  if (!company) {
    return res.status(404).json({ message: "Bus company not found" });
  }

  // Staff can only view their own company
  if (req.user.role === "staff" && !userBelongsToCompany(req.user, company._id)) {
    return res.status(403).json({ message: "Access denied: not your bus company" });
  }

  res.json(company);
});

// ─────────────────────────────────────────────
// POST /api/bus-companies
// Admin only: create a new bus company
// ─────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
  const { name, shortName, code, logo, hotline, description, stationIds } = req.body;

  // Resolve and validate stations if provided
  let stations = [];
  if (Array.isArray(stationIds) && stationIds.length > 0) {
    stations = stationIds;
  }

  const company = await BusCompany.create({
    name,
    shortName: shortName || "",
    code,
    logo: logo || "",
    hotline: hotline || "",
    description: description || "",
    stations,
    status: "active"
  });

  // Back-link: add this company to each station's busCompanies array
  if (stations.length > 0) {
    await Station.updateMany(
      { _id: { $in: stations } },
      { $addToSet: { busCompanies: company._id } }
    );
  }

  const populated = await company.populate("stations", "name city");
  res.status(201).json({ message: "Bus company created", company: populated });
});

// ─────────────────────────────────────────────
// PUT /api/bus-companies/:id
// Admin: any company | Staff: only their own company
// ─────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
  const company = await BusCompany.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Bus company not found" });

  // RBAC: staff can only edit their own company
  if (!userBelongsToCompany(req.user, company._id)) {
    return res.status(403).json({ message: "Access denied: not your bus company" });
  }

  const { name, shortName, code, logo, hotline, description, status } = req.body;

  if (name !== undefined) company.name = name;
  if (shortName !== undefined) company.shortName = shortName;
  // code change only allowed for admin (staff cannot change a company's code)
  if (code !== undefined && req.user.role === "admin") company.code = code;
  if (logo !== undefined) company.logo = logo;
  if (hotline !== undefined) company.hotline = hotline;
  if (description !== undefined) company.description = description;
  // status change only allowed for admin
  if (status !== undefined && req.user.role === "admin") company.status = status;

  await company.save();
  const populated = await company.populate("stations", "name city");
  res.json({ message: "Bus company updated", company: populated });
});

// ─────────────────────────────────────────────
// DELETE /api/bus-companies/:id
// Admin only
// ─────────────────────────────────────────────
exports.remove = asyncHandler(async (req, res) => {
  const company = await BusCompany.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Bus company not found" });

  // Remove back-links from all stations
  await Station.updateMany(
    { busCompanies: company._id },
    { $pull: { busCompanies: company._id } }
  );

  // Clear busCompany from staff assigned to this company
  await User.updateMany(
    { busCompany: company._id },
    { $set: { busCompany: null, managedStations: [] } }
  );

  await BusCompany.findByIdAndDelete(req.params.id);
  res.json({ message: "Bus company deleted" });
});

// ─────────────────────────────────────────────
// POST /api/bus-companies/:id/stations
// Admin or own-company staff: add stations (array of stationIds)
// Body: { stationIds: ["id1", "id2"] }
// ─────────────────────────────────────────────
exports.addStations = asyncHandler(async (req, res) => {
  const company = await BusCompany.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Bus company not found" });

  if (!userBelongsToCompany(req.user, company._id)) {
    return res.status(403).json({ message: "Access denied: not your bus company" });
  }

  const { stationIds } = req.body;
  if (!Array.isArray(stationIds) || stationIds.length === 0) {
    return res.status(400).json({ message: "stationIds must be a non-empty array" });
  }

  // Verify all stations exist
  const found = await Station.find({ _id: { $in: stationIds } }, "_id");
  if (found.length !== stationIds.length) {
    return res.status(400).json({ message: "One or more station IDs are invalid" });
  }

  // Add to company (no duplicates)
  await BusCompany.findByIdAndUpdate(
    company._id,
    { $addToSet: { stations: { $each: stationIds } } }
  );

  // Back-link: add company to each station
  await Station.updateMany(
    { _id: { $in: stationIds } },
    { $addToSet: { busCompanies: company._id } }
  );

  const updated = await BusCompany.findById(company._id).populate("stations", "name city address");
  res.json({ message: "Stations added", company: updated });
});

// ─────────────────────────────────────────────
// DELETE /api/bus-companies/:id/stations/:stationId
// Admin or own-company staff: remove a single station
// ─────────────────────────────────────────────
exports.removeStation = asyncHandler(async (req, res) => {
  const company = await BusCompany.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Bus company not found" });

  if (!userBelongsToCompany(req.user, company._id)) {
    return res.status(403).json({ message: "Access denied: not your bus company" });
  }

  const { stationId } = req.params;

  await BusCompany.findByIdAndUpdate(
    company._id,
    { $pull: { stations: stationId } }
  );

  // Remove back-link from station
  await Station.findByIdAndUpdate(
    stationId,
    { $pull: { busCompanies: company._id } }
  );

  // Also remove this station from any staff's managedStations within this company
  await User.updateMany(
    { busCompany: company._id },
    { $pull: { managedStations: stationId } }
  );

  const updated = await BusCompany.findById(company._id).populate("stations", "name city address");
  res.json({ message: "Station removed", company: updated });
});

// ─────────────────────────────────────────────
// PUT /api/users/:id/assign-company
// Admin only: assign a staff user to a bus company (and optional stations)
// Body: { busCompanyId: "...", stationIds?: ["..."] }
// ─────────────────────────────────────────────
exports.assignStaffToCompany = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  if (targetUser.role === "user") {
    return res.status(400).json({ message: "Cannot assign a regular user to a bus company. Change their role to staff first." });
  }

  const { busCompanyId, stationIds = [] } = req.body;

  // Validate the company exists (if not null)
  if (busCompanyId) {
    const company = await BusCompany.findById(busCompanyId);
    if (!company) return res.status(404).json({ message: "Bus company not found" });

    // Validate that all provided stationIds belong to this company
    if (stationIds.length > 0) {
      const companyStationStrings = company.stations.map((s) => s.toString());
      const invalid = stationIds.filter((id) => !companyStationStrings.includes(id));
      if (invalid.length > 0) {
        return res.status(400).json({
          message: `These stations do not belong to the company: ${invalid.join(", ")}`
        });
      }
    }
  }

  targetUser.busCompany = busCompanyId || null;
  targetUser.managedStations = stationIds;
  await targetUser.save();

  const updated = await User.findById(targetUser._id)
    .select("-password")
    .populate("busCompany", "name shortName code")
    .populate("managedStations", "name city");

  res.json({ message: "Staff company assignment updated", user: updated });
});
