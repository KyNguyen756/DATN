const router = require("express").Router();

const bookingController = require("../controllers/bookingController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, bookingController.createBooking);

router.get("/my", auth, bookingController.getMyBookings);

router.get("/:id", auth, bookingController.getBookingById);

router.patch("/:id/cancel", auth, bookingController.cancelBooking);

router.post("/:id/confirm", auth, bookingController.confirmBooking);

module.exports = router;
