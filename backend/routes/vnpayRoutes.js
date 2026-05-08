const express = require("express");
const router = express.Router();

const vnpayController = require("../controllers/vnpayController");
const authMiddleware = require("../middleware/authMiddleware");

// Create VNPay payment URL (requires auth — user must own the booking)
router.post("/create-payment-url", authMiddleware, vnpayController.createPaymentUrl);

// VNPay return URL — browser redirect after payment
// Handles: checksum verify → payment processing → ticket creation → response
// NO auth required (user browser redirect from VNPay — session may be intact via localStorage)
router.get("/return", vnpayController.vnpayReturn);

module.exports = router;
