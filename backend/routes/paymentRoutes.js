/**
 * routes/paymentRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Định tuyến cho module thanh toán VNPay.
 *
 * Cách mount vào app.js:
 *
 *   const paymentRoutes = require("./routes/paymentRoutes");
 *   app.use("/api/payment", paymentRoutes);
 *
 * ── Danh sách endpoints ──────────────────────────────────────────────────────
 *
 *   POST  /api/payment/vnpay/create         🔒 Tạo URL thanh toán VNPay
 *   GET   /api/payment/vnpay/return              VNPay redirect người dùng về
 *   GET   /api/payment/vnpay/ipn                 VNPay callback server-to-server
 *   GET   /api/payment/status/:bookingId    🔒 Kiểm tra trạng thái thanh toán
 *
 * 🔒 = yêu cầu JWT (authMiddleware)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router  = express.Router();

// Import controllers
const {
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN,
  getPaymentStatus,
} = require("../controllers/payment.controller");

// authMiddleware export trực tiếp (module.exports = fn), không phải named export
const authMiddleware = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/vnpay/create
// ─────────────────────────────────────────────────────────────────────────────
// Nhận bookingId → tạo URL thanh toán VNPay → trả về cho frontend redirect
// Yêu cầu: đã đăng nhập (chỉ chủ booking mới được tạo URL)
router.post("/vnpay/create", authMiddleware, createVNPayPayment);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/vnpay/return
// ─────────────────────────────────────────────────────────────────────────────
// VNPay redirect người dùng về đây sau khi thanh toán xong
// ⚠️ KHÔNG cần auth — VNPay gọi kèm người dùng, không có token
// ⚠️ KHÔNG cập nhật DB — chỉ redirect frontend đến trang kết quả
router.get("/vnpay/return", vnpayReturn);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/vnpay/ipn
// ─────────────────────────────────────────────────────────────────────────────
// VNPay server gọi trực tiếp (server-to-server), KHÔNG qua trình duyệt
// ⚠️ KHÔNG cần auth — bảo mật bằng xác thực chữ ký HMAC-SHA512
// ✅ ĐÂY LÀ NƠI CẬP NHẬT DB CHÍNH THỨC (tạo booking paid + vé + QR)
router.get("/vnpay/ipn", vnpayIPN);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/status/:bookingId
// ─────────────────────────────────────────────────────────────────────────────
// Frontend polling sau khi redirect về trang kết quả
// Trả về paymentStatus + danh sách vé (nếu paid)
// Yêu cầu: đã đăng nhập (chủ booking hoặc admin)
router.get("/status/:bookingId", authMiddleware, getPaymentStatus);

module.exports = router;
