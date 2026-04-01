const express = require("express");
const router = express.Router();
const tripseatController = require("../controllers/tripseatController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// Admin: generate seats for a trip
router.post(
  "/generate/:tripId",
  authMiddleware,
  adminMiddleware,
  tripseatController.generateTripSeats
);

// Staff/Admin: get all currently locked seats (must be before /:tripId routes!)
router.get("/locked", authMiddleware, staffMiddleware, tripseatController.getLockedSeats);

// Public: get all seats for a trip (with auto-release of expired locks)
router.get("/:tripId/count", tripseatController.getSeatCount);
router.get("/:tripId", tripseatController.getTripSeats);

// User: lock / unlock a seat
router.post("/lock/:tripSeatId", authMiddleware, tripseatController.lockSeat);
router.delete("/unlock/:tripSeatId", authMiddleware, tripseatController.unlockSeat);

module.exports = router;