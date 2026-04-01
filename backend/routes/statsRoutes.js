const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public: high-level stats for homepage badge
router.get("/summary", statsController.getPublicStats);

// Admin: full dashboard stats
router.get("/admin", authMiddleware, adminMiddleware, statsController.getAdminStats);

module.exports = router;
