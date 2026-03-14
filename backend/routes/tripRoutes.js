const express = require("express");

const router = express.Router();

const tripController = require("../controllers/tripController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  tripController.createTrip
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  tripController.updateTrip
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  tripController.deleteTrip
);

router.get("/", tripController.getTrips);

router.get("/:id", tripController.getTripById);

module.exports=router;