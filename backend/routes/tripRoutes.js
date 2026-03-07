const router = require("express").Router();

const tripController = require("../controllers/tripController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, tripController.createTrip);

router.get("/", tripController.getTrips);

router.get("/:id", tripController.getTripById);

router.put("/:id", auth, tripController.updateTrip);

router.delete("/:id", auth, tripController.deleteTrip);

module.exports = router;
