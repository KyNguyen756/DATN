const router = require("express").Router();

const seatController = require("../controllers/seatController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.post("/", requireAdmin, seatController.createBus);

router.get("/bus/:busId", seatController.getSeatsByBus);

router.put("/:id", requireAdmin, seatController.updateSeat);

router.delete("/:id", requireAdmin, seatController.deleteSeat);

module.exports = router;