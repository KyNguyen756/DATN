const router = require("express").Router();

const seatController = require("../controllers/seatController");
const auth = require("../middleware/authMiddleware");

router.get("/bus/:busId", seatController.getSeatsByBus);

router.put("/:id", auth, seatController.updateSeat);

router.delete("/:id", auth, seatController.deleteSeat);

module.exports = router;
