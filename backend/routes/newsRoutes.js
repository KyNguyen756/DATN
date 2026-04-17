// backend/routes/newsRoutes.js
const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../middleware/uploadMiddleware");

// ── Public routes (no auth) ─────────────────────────────────────────────────
router.get("/", newsController.getPublicNews);
router.get("/:slug", newsController.getNewsBySlug);
router.patch("/:slug/view", newsController.incrementViews);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get(
  "/admin/all",
  authMiddleware,
  authorizeRoles("admin"),
  newsController.getAdminNews
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("thumbnail"),
  newsController.validateCreate,
  newsController.createNews
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("thumbnail"),
  newsController.validateUpdate,
  newsController.updateNews
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  newsController.deleteNews
);

router.patch(
  "/:id/publish",
  authMiddleware,
  authorizeRoles("admin"),
  newsController.togglePublish
);

router.patch(
  "/:id/pin",
  authMiddleware,
  authorizeRoles("admin"),
  newsController.togglePin
);

module.exports = router;
