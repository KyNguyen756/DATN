const express = require("express");

const router = express.Router();

const tripSeatController = require("../controllers/tripSeatController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
  "/generate/:tripId",
  authMiddleware,
  adminMiddleware,
  tripSeatController.generateTripSeats
);

router.get(
  "/:tripId",
  tripSeatController.getTripSeats
);

router.post(
  "/lock/:tripSeatId",
  authMiddleware,
  tripSeatController.lockSeat
);

module.exports = router;