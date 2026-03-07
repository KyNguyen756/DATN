const router = require("express").Router();

const authController = require("../controllers/authController");

const auth = require("../middleware/authMiddleware");

//REGISTER
router.post(
    "/register",
    authController.register
)

//LOGIN
router.post(
    "/login",
    authController.login
)

module.exports = router;