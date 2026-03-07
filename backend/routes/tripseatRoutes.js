const router = require("express").Router();
const tripSeatController = require("../controllers/tripseatController");
const auth = require("../middleware/authMiddleware");

router.get("/:tripId", tripSeatController.getSeatsByTrip);

router.post("/lock", auth, tripSeatController.lockSeat);

router.post("/unlock", auth, tripSeatController.unlockSeat);

module.exports = router;
