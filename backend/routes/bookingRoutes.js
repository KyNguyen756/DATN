const router = require("express").Router();

const bookingController = require("../controllers/bookingController");
const auth = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");

router.get("/", requireAdmin, bookingController.getAllBookings);
router.post("/", auth, bookingController.createBooking);

router.get("/my", auth, bookingController.getMyBookings);

router.get("/:id", auth, bookingController.getBookingById);

router.patch("/:id/cancel", auth, bookingController.cancelBooking);

router.post("/:id/confirm", requireAdmin, bookingController.confirmBooking);

module.exports = router;
