const router = require("express").Router();

const seatController = require("../controllers/seatController");
const { requireAdmin } = require("../middleware/authMiddleware");

<<<<<<< HEAD
router.post("/", requireAdmin, seatController.createBus);

=======
>>>>>>> b4d5650415845ad33c5001b7216727be18bae0a7
router.get("/bus/:busId", seatController.getSeatsByBus);

router.put("/:id", requireAdmin, seatController.updateSeat);

router.delete("/:id", requireAdmin, seatController.deleteSeat);

module.exports = router;