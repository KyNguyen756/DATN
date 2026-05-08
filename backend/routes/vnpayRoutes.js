const express = require("express");
const router = express.Router();

const vnpayController = require("../controllers/vnpayController");
const authMiddleware = require("../middleware/authMiddleware");

// Create VNPay payment URL (requires auth — user must own the booking)
router.post("/create-payment-url", authMiddleware, vnpayController.createPaymentUrl);

// VNPay IPN callback — server-to-server, NO auth (VNPay calls this directly)
router.get("/ipn", vnpayController.vnpayIpn);

// VNPay return URL — browser redirect after payment, NO auth needed
// (user may have lost session during redirect; we verify via checksum)
router.get("/return", vnpayController.vnpayReturn);

module.exports = router;
