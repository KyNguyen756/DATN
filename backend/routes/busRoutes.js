const router = require("express").Router();

const busController = require("../controllers/busController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.post("/", requireAdmin, busController.createBus);

router.get("/", busController.getBuses);

router.get("/:id", busController.getBusById);

router.put("/:id", requireAdmin, busController.updateBus);

router.delete("/:id", requireAdmin, busController.deleteBus);

module.exports = router;
