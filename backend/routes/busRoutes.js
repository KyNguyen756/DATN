const express = require("express");

const router = express.Router();

const busController = require("../controllers/busController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  busController.createBus
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  busController.updateBus
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  busController.deleteBus
);

router.get("/", busController.getBuses);

router.get("/:id", busController.getBusById);

router.post(
  "/:busId/generate-seats",
  authMiddleware,
  adminMiddleware,
  busController.generateSeats
);

// Alias: /api/buses/:busId/seats/generate
router.post(
  "/:busId/seats/generate",
  authMiddleware,
  adminMiddleware,
  busController.generateSeats
);

router.get(
  "/:busId/seats",
  busController.getSeats
);

module.exports = router;