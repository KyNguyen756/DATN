const router = require("express").Router();

const userController = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");

const upload = require("../utils/uploadAvatar");

// CRUD
router.get(
  "/",
  auth,
  userController.getUsers
);

router.get(
  "/:id",
  auth,
  userController.getUserById
);

router.put(
  "/profile",
  auth,
  userController.updateProfile
);

router.put(
  "/avatar",
  auth,
  upload.single("avatar"),
  userController.updateAvatar
);

router.delete(
  "/:id",
  auth,
  userController.deleteUser
);

module.exports = router;
