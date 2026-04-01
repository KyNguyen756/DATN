const express = require("express");
const router = express.Router();

const tripController = require("../controllers/tripController");
const auth = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// ── Public (customer-facing) ─────────────────────────────────────────────────
// These endpoints have NO company filter — customers see trips from all companies.
router.get("/search", tripController.searchTrips);
router.get("/:id",    tripController.getTripById);

// ── Auth required (staff/admin management list) ───────────────────────────────
// GET /api/trips  → company-scoped (admin=all, staff=own company only)
router.get("/", auth, staffMiddleware, tripController.getTrips);

// POST /api/trips → create; staff auto-gets their busCompany
router.post("/", auth, staffMiddleware, tripController.createTrip);

// PUT /api/trips/:id → edit; company RBAC checked in controller
router.put("/:id", auth, staffMiddleware, tripController.updateTrip);

// DELETE /api/trips/:id → admin only
router.delete("/:id", auth, adminMiddleware, tripController.deleteTrip);

module.exports = router;