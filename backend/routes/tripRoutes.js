const router = require("express").Router();

const tripController = require("../controllers/tripController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.post("/", requireAdmin, tripController.createTrip);

router.get("/", tripController.getTrips);

router.get("/:id", tripController.getTripById);

router.put("/:id", requireAdmin, tripController.updateTrip);

router.delete("/:id", requireAdmin, tripController.deleteTrip);

module.exports = router;
