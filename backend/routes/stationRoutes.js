const express = require("express");
const router = express.Router();
const stationController = require("../controllers/stationController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, adminMiddleware, stationController.createStation);
router.get("/", stationController.getStations);
router.get("/:id", stationController.getStationById);
router.put("/:id", authMiddleware, adminMiddleware, stationController.updateStation);
router.delete("/:id", authMiddleware, adminMiddleware, stationController.deleteStation);

module.exports = router;
