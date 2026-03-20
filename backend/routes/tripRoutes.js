const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public routes
router.get("/search", tripController.searchTrips);
router.get("/", tripController.getTrips);
router.get("/:id", tripController.getTripById);

// Admin-only routes
router.post("/", authMiddleware, adminMiddleware, tripController.createTrip);
router.put("/:id", authMiddleware, adminMiddleware, tripController.updateTrip);
router.delete("/:id", authMiddleware, adminMiddleware, tripController.deleteTrip);

module.exports = router;