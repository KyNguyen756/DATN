const router = require("express").Router();
const routeController = require("../controllers/routeController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.get("/", requireAdmin, routeController.getAll);
router.get("/:id", requireAdmin, routeController.getById);
router.post("/", requireAdmin, routeController.create);
router.put("/:id", requireAdmin, routeController.update);
router.delete("/:id", requireAdmin, routeController.delete);

module.exports = router;
