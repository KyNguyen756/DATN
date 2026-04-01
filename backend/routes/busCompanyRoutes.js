const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/busCompanyController");
const auth = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// ── Auth required: all bus-company routes need login ─────────────────────────
// GET /api/bus-companies
//   Admin → all companies (with pagination + search)
//   Staff → only their own company (returned as a list of 1 or an object)
router.get("/", auth, staffMiddleware, ctrl.getAll);

// GET /api/bus-companies/:id
//   Admin → any company
//   Staff → only their own company (enforced in controller)
router.get("/:id", auth, staffMiddleware, ctrl.getById);

// ── Admin only ───────────────────────────────────────────────────────────────
router.post("/",    auth, adminMiddleware, ctrl.create);
router.delete("/:id", auth, adminMiddleware, ctrl.remove);

// ── Admin or own-company staff ───────────────────────────────────────────────
router.put("/:id",                         auth, staffMiddleware, ctrl.update);
router.post("/:id/stations",               auth, staffMiddleware, ctrl.addStations);
router.delete("/:id/stations/:stationId",  auth, staffMiddleware, ctrl.removeStation);

module.exports = router;
