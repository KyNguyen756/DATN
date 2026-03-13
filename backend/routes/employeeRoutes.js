const router = require("express").Router();
const employeeController = require("../controllers/employeeController");
const { requireAdmin } = require("../middleware/authMiddleware");

router.get("/", requireAdmin, employeeController.getAll);
router.get("/stats", requireAdmin, (req, res) => res.json({ total: 0 }));
router.get("/:id", requireAdmin, employeeController.getById);
router.post("/", requireAdmin, employeeController.create);
router.put("/:id", requireAdmin, employeeController.update);
router.delete("/:id", requireAdmin, employeeController.delete);

module.exports = router;
