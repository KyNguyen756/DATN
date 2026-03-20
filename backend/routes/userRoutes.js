const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const userController = require("../controllers/userController");
const adminMiddleware = require("../middleware/adminMiddleware");

// Auth-required: own profile
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.post("/avatar", authMiddleware, upload.single("avatar"), userController.uploadAvatar);

// Admin: user management
router.get("/", authMiddleware, adminMiddleware, userController.getAllUsers);
router.put("/:id/status", authMiddleware, adminMiddleware, userController.updateUserStatus);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;
