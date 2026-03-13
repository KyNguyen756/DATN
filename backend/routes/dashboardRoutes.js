const router = require("express").Router();
const dashboardController = require("../controllers/dashboardController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.get("/stats", requireAdmin, dashboardController.getStats);

module.exports = router;
