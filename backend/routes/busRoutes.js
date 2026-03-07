const router = require("express").Router();

const busController = require("../controllers/busController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, busController.createBus);

router.get("/", busController.getBuses);

router.get("/:id", busController.getBusById);

router.put("/:id", auth, busController.updateBus);

router.delete("/:id", auth, busController.deleteBus);

module.exports = router;
