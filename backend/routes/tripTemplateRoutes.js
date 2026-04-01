const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/tripTemplateController");
const auth = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const staffMiddleware = require("../middleware/staffMiddleware");

// All routes require auth + staff-or-admin
// Fine-grained RBAC (own-company check) is enforced inside the controller.

// ── CRUD ────────────────────────────────────────────────────────────────────
// GET /api/trip-templates         → company-scoped list (admin=all, staff=own)
router.get("/",    auth, staffMiddleware, ctrl.getAll);
// GET /api/trip-templates/:id     → company-scoped detail
router.get("/:id", auth, staffMiddleware, ctrl.getById);
// POST /api/trip-templates        → create; staff auto-gets busCompany
router.post("/",   auth, staffMiddleware, ctrl.create);
// PUT /api/trip-templates/:id     → update; RBAC in controller
router.put("/:id", auth, staffMiddleware, ctrl.update);
// DELETE /api/trip-templates/:id  → admin only (or own-company staff per controller)
router.delete("/:id", auth, staffMiddleware, ctrl.remove);

// ── Generate actions ────────────────────────────────────────────────────────
// POST /api/trip-templates/:id/generate       → 1 chuyến cho ngày cụ thể
router.post("/:id/generate",      auth, staffMiddleware, ctrl.generate);
// POST /api/trip-templates/:id/bulk-generate  → nhiều chuyến theo range ngày
router.post("/:id/bulk-generate", auth, staffMiddleware, ctrl.bulkGenerate);

module.exports = router;
