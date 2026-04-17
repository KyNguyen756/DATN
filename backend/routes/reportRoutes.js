const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

// Admin-only report exports
router.get("/excel", authMiddleware, authorizeRoles("admin"), reportController.exportExcel);
router.get("/pdf",   authMiddleware, authorizeRoles("admin"), reportController.exportPDF);

module.exports = router;
