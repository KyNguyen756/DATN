const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// Staff counter sale (no user account required for customer)
router.post("/counter", authMiddleware, staffMiddleware, bookingController.counterSale);

// Unified checkout (booking + tickets + promo — atomic)
router.post("/checkout", authMiddleware, bookingController.checkout);


router.post(
  "/",
  authMiddleware,
  bookingController.createBooking
);

router.get(
  "/my-bookings",
  authMiddleware,
  bookingController.getMyBookings
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  bookingController.getBookings
);

router.get(
  "/:id",
  authMiddleware,
  bookingController.getBookingById
);

router.delete(
  "/:id",
  authMiddleware,
  bookingController.cancelBooking
);

module.exports = router;