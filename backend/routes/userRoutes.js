const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const validateObjectId = require("../middleware/validateObjectId");
const upload = require("../middleware/uploadMiddleware");
const userController = require("../controllers/userController");

// ── Own profile ───────────────────────────────────────────────────────────────
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.put("/change-password", authMiddleware, userController.changePassword);
router.post("/avatar", authMiddleware, upload.single("avatar"), userController.uploadAvatar);

// ── Admin: user management ───────────────────────────────────────────────────
router.get("/", authMiddleware, authorizeRoles("admin"), userController.getAllUsers);
router.put("/:id/status", authMiddleware, authorizeRoles("admin"), validateObjectId(), userController.updateUserStatus);
router.put("/:id/role",   authMiddleware, authorizeRoles("admin"), validateObjectId(), userController.changeUserRole);
router.delete("/:id",     authMiddleware, authorizeRoles("admin"), validateObjectId(), userController.deleteUser);

module.exports = router;

