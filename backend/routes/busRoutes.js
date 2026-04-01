const express = require("express");
const router = express.Router();

const busController = require("../controllers/busController");
const auth = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// ── Public (customer-facing) ─────────────────────────────────────────────────
// Note: seats for a trip are exposed via /api/trip-seats, not here.

// ── Auth required (staff/admin management) ───────────────────────────────────
// GET /api/buses        → company-scoped list (admin=all, staff=own company)
router.get("/", auth, staffMiddleware, busController.getBuses);

// GET /api/buses/:id    → company-scoped single bus
router.get("/:id", auth, staffMiddleware, busController.getBusById);

// POST /api/buses       → create; staff auto-gets their busCompany
router.post("/", auth, staffMiddleware, busController.createBus);

// PUT /api/buses/:id    → edit; staff RBAC checked in controller
router.put("/:id", auth, staffMiddleware, busController.updateBus);

// DELETE /api/buses/:id → admin only
router.delete("/:id", auth, adminMiddleware, busController.deleteBus);

// POST /api/buses/:busId/generate-seats → staff/admin with RBAC in controller
router.post("/:busId/generate-seats", auth, staffMiddleware, busController.generateSeats);

// GET /api/buses/:busId/seats → auth required
router.get("/:busId/seats", auth, staffMiddleware, busController.getSeats);

module.exports = router;