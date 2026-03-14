const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const userController = require("../controllers/userController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);

router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.uploadAvatar
);

router.get("/", authMiddleware, adminMiddleware, userController.getAllUsers);
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
