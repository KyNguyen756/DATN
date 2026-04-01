const express = require("express");
const router  = express.Router();

const bookingController = require("../controllers/bookingController");
const authMiddleware    = require("../middleware/authMiddleware");
const adminMiddleware   = require("../middleware/adminMiddleware");
const staffMiddleware   = require("../middleware/staffMiddleware");

// Staff/Admin: Counter sale (walk-in booking — must come BEFORE the generic POST /)
router.post(
  "/counter",
  authMiddleware,
  staffMiddleware,
  bookingController.createCounterBooking
);

// Authenticated user: online booking
router.post(
  "/",
  authMiddleware,
  bookingController.createBooking
);

// Authenticated user: view own bookings
router.get(
  "/my-bookings",
  authMiddleware,
  bookingController.getMyBookings
);

// Admin + Staff: view all bookings (staff see their company's trips only)
router.get(
  "/",
  authMiddleware,
  staffMiddleware,
  bookingController.getBookings
);

// Owner / Staff / Admin: cancel booking
router.delete(
  "/:id",
  authMiddleware,
  bookingController.cancelBooking
);

module.exports = router;