/**
 * controllers/payment.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Xử lý toàn bộ luồng thanh toán VNPay cho hệ thống bán vé xe khách.
 *
 * ── Luồng thanh toán VNPay ──────────────────────────────────────────────────
 *
 *  [Frontend] → POST /api/payment/vnpay/create  →  nhận paymentUrl
 *      ↓
 *  Redirect người dùng → VNPay sandbox
 *      ↓
 *  Người dùng thanh toán / hủy
 *      ↓
 *  VNPay gọi đồng thời:
 *    (A) GET /api/payment/vnpay/ipn   ← server-to-server (ĐÂY LÀ CẬP NHẬT DB)
 *    (B) GET /api/payment/vnpay/return ← redirect người dùng về trang kết quả
 *
 * ── Nguyên tắc thiết kế ─────────────────────────────────────────────────────
 *  • Chỉ cập nhật DB trong IPN (đáng tin cậy, không phụ thuộc trình duyệt).
 *  • vnpayReturn chỉ đọc query string và redirect frontend.
 *  • Mọi thao tác DB đều idempotent (kiểm tra trạng thái trước khi xử lý).
 *  • Không throw exception trong IPN — luôn trả JSON cho VNPay.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Booking      = require("../models/bookingModel");
const Ticket       = require("../models/ticketModel");
const asyncHandler = require("../utils/asyncHandler");
const QRCode       = require("qrcode");
const {
  createPaymentUrl,
  verifyReturnUrl,
  verifyIPN,
  getResponseMessage,
} = require("../utils/vnpay");

// URL frontend dùng để redirect kết quả
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ─────────────────────────────────────────────────────────────────────────────
// Helper nội bộ: Sinh mã vé ngẫu nhiên (VXB-XXXXXX) — không trùng
// ─────────────────────────────────────────────────────────────────────────────
async function _generateTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "VXB-";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await Ticket.findOne({ code }).lean();
    if (!exists) return code;
  }
  // Fallback timestamp-based (đảm bảo không trùng)
  return "VXB-" + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper nội bộ: Tạo Ticket + QR cho tất cả ghế trong booking
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Tạo vé và QR code cho từng ghế trong booking.
 * Được gọi bởi IPN khi thanh toán VNPay thành công.
 *
 * @param   {object} booking   Mongoose document Booking (đã populated)
 * @returns {Ticket[]}         Mảng vé đã được insert vào DB
 */
async function _createTicketsForBooking(booking) {
  const ticketDocs = [];

  for (const seatId of booking.seats) {
    const code   = await _generateTicketCode();
    const ticket = new Ticket({
      booking: booking._id,
      trip:    booking.trip,
      seat:    seatId,
      code,
    });

    // QR chứa đủ thông tin để nhân viên check-in ngoại tuyến
    const qrPayload = JSON.stringify({
      ticketId: ticket._id,
      code:     ticket.code,
      trip:     String(booking.trip),
      booking:  String(booking._id),
    });
    ticket.qrCode = await QRCode.toDataURL(qrPayload);
    ticketDocs.push(ticket);
  }

  // insertMany hiệu quả hơn save() lặp từng cái
  return Ticket.insertMany(ticketDocs);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. createVNPayPayment
// POST /api/payment/vnpay/create
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Tạo URL thanh toán VNPay từ bookingId.
 *
 * Yêu cầu: người dùng đã đăng nhập (protect middleware).
 *
 * Body:   { bookingId: string }
 * Return: { paymentUrl: string, txnRef: string }
 */
exports.createVNPayPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  // Validate input
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId là bắt buộc" });
  }

  // Lấy booking — chỉ cần các field cần thiết
  const booking = await Booking.findById(bookingId).select(
    "user finalPrice paymentStatus bookingStatus paymentMethod"
  );

  if (!booking) {
    return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
  }

  // Chỉ chủ booking mới được tạo URL thanh toán
  if (booking.user?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Bạn không có quyền thanh toán đơn này" });
  }

  // Chặn thanh toán lại nếu đã paid
  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ message: "Đơn đặt vé này đã được thanh toán" });
  }

  // Chặn thanh toán booking đã bị hủy
  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Đơn đặt vé đã bị hủy, không thể thanh toán" });
  }

  // Lấy IP thực (hỗ trợ proxy/reverse-proxy)
  const ipAddr =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  // Tạo URL thanh toán và txnRef duy nhất
  let paymentUrl, txnRef;
  try {
    ({ paymentUrl, txnRef } = createPaymentUrl({
      orderId:   bookingId,
      amount:    booking.finalPrice,
      orderInfo: `Thanh toan ve xe - ${bookingId}`,
      ipAddr,
    }));
  } catch (err) {
    console.error("[VNPay Create] 🔥 Lỗi tạo URL thanh toán:", err.message);
    return res.status(500).json({ message: err.message || "Không thể tạo URL thanh toán VNPay" });
  }

  // Lưu txnRef + đánh dấu phương thức thanh toán để đối soát sau
  booking.vnpayTxnRef   = txnRef;
  booking.paymentMethod = "vnpay";
  await booking.save();

  return res.json({ paymentUrl, txnRef });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. vnpayReturn
// GET /api/payment/vnpay/return
// ─────────────────────────────────────────────────────────────────────────────
/**
 * VNPay redirect người dùng về đây sau khi thanh toán (thành công hoặc thất bại).
 *
 * ⚠️  KHÔNG cập nhật DB ở đây.
 *     Người dùng có thể đóng tab / mất mạng nên không đáng tin.
 *     Mọi cập nhật DB thực hiện ở IPN.
 *
 * → Chỉ xác thực chữ ký rồi redirect sang trang kết quả của frontend.
 */
exports.vnpayReturn = asyncHandler(async (req, res) => {
  const result = verifyReturnUrl(req.query);

  // Chữ ký không hợp lệ → có thể bị giả mạo hoặc dữ liệu bị sửa đổi
  if (!result.isValid) {
    console.warn("[VNPay Return] ❗ Chữ ký không hợp lệ:", req.query);
    return res.redirect(`${FRONTEND_URL}/payment/result?status=invalid`);
  }

  const { responseCode, txnRef } = result;
  // txnRef có dạng: bookingId_timestamp → lấy phần bookingId
  const bookingId = txnRef.split("_")[0];

  if (responseCode === "00") {
    // Thanh toán thành công → frontend tự gọi /api/payment/status để lấy vé
    return res.redirect(
      `${FRONTEND_URL}/payment/result?status=success&bookingId=${bookingId}&txnRef=${txnRef}`
    );
  }

  // Thất bại / hủy → hiển thị thông báo lỗi
  const message = encodeURIComponent(getResponseMessage(responseCode));
  return res.redirect(
    `${FRONTEND_URL}/payment/result?status=failed&bookingId=${bookingId}&code=${responseCode}&message=${message}`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. vnpayIPN
// GET /api/payment/vnpay/ipn
// ─────────────────────────────────────────────────────────────────────────────
/**
 * IPN (Instant Payment Notification) — VNPay server gọi trực tiếp, không qua trình duyệt.
 *
 * ✅  ĐÂY LÀ NƠI CẬP NHẬT DB CHÍNH THỨC.
 *
 * Khi thanh toán thành công:
 *   1. Cập nhật Booking.paymentStatus = "paid"
 *   2. Ghi transactionId, paymentMethod, vnpayTxnRef
 *   3. Tạo Ticket + QR cho từng ghế (nếu chưa có)
 *
 * Yêu cầu phản hồi từ VNPay (bắt buộc):
 *   • { RspCode: "00", Message: "Confirm Success" } — đã nhận và xử lý OK
 *   • Các mã lỗi khác khi có vấn đề (VNPay sẽ retry sau)
 *
 * ⚠️  Không dùng protect middleware — VNPay server gọi không có JWT.
 *     Bảo mật bằng xác thực chữ ký HMAC-SHA512.
 * ⚠️  Không throw exception — luôn trả JSON để VNPay không retry vô hạn.
 */
exports.vnpayIPN = asyncHandler(async (req, res) => {
  try {
    const result = verifyIPN(req.query);

    // ── Bước 1: Xác thực chữ ký HMAC-SHA512 ──────────────────────────────
    if (!result.isValid) {
      console.warn("[VNPay IPN] ❗ Chữ ký không hợp lệ. Query:", req.query);
      return res.json({ RspCode: "97", Message: "Invalid Checksum" });
    }

    const { responseCode, txnRef, amount, transactionNo } = result;

    // ── Bước 2: Tìm booking theo txnRef (bookingId_timestamp) ────────────
    const bookingId = txnRef.split("_")[0];
    const booking   = await Booking.findById(bookingId);

    if (!booking) {
      console.warn("[VNPay IPN] ❗ Không tìm thấy booking:", bookingId);
      return res.json({ RspCode: "01", Message: "Order Not Found" });
    }

    // ── Bước 3: Kiểm tra số tiền (chống giả mạo amount) ──────────────────
    if (booking.finalPrice !== amount) {
      console.warn(
        `[VNPay IPN] ❗ Số tiền không khớp — DB: ${booking.finalPrice}, VNPay: ${amount}`
      );
      return res.json({ RspCode: "04", Message: "Invalid Amount" });
    }

    // ── Bước 4: Idempotent — đã xử lý rồi thì báo lại đã nhận ───────────
    if (booking.paymentStatus === "paid") {
      console.info("[VNPay IPN] ✔ Booking đã xử lý trước đó:", bookingId);
      return res.json({ RspCode: "02", Message: "Order Already Confirmed" });
    }

    // ── Bước 5: Xử lý kết quả thanh toán ────────────────────────────────
    if (responseCode === "00") {
      // ════ THANH TOÁN THÀNH CÔNG ════════════════════════════════════════

      // 5a. Cập nhật trạng thái booking
      booking.paymentStatus  = "paid";
      booking.paymentMethod  = "vnpay";
      booking.transactionId  = transactionNo;  // vnp_TransactionNo từ VNPay
      booking.vnpayTxnRef    = txnRef;
      await booking.save();

      // 5b. Tạo vé nếu chưa có (idempotent — tránh duplicate nếu IPN gọi 2 lần)
      const existingCount = await Ticket.countDocuments({ booking: booking._id });

      if (existingCount === 0) {
        try {
          const tickets = await _createTicketsForBooking(booking);
          console.info(
            `[VNPay IPN] ✅ Đã tạo ${tickets.length} vé cho booking ${bookingId}`
          );
        } catch (ticketErr) {
          // Log lỗi nhưng không làm fail IPN.
          // Booking đã được đánh dấu paid — admin có thể tạo vé thủ công sau.
          console.error("[VNPay IPN] ⚠️ Lỗi tạo vé:", ticketErr.message);
        }
      } else {
        console.info(
          `[VNPay IPN] ℹ️ Vé đã tồn tại (${existingCount} vé), bỏ qua tạo mới`
        );
      }

      console.info(
        `[VNPay IPN] ✅ Thanh toán thành công — Booking: ${bookingId} | TxnNo: ${transactionNo}`
      );

    } else {
      // ════ THANH TOÁN THẤT BẠI / BỊ HỦY ════════════════════════════════
      // Cập nhật trạng thái thất bại để frontend biết và có thể retry
      booking.paymentStatus = "failed";
      booking.vnpayTxnRef   = txnRef;
      if (transactionNo) booking.transactionId = transactionNo;
      await booking.save();

      console.info(
        `[VNPay IPN] ❌ Thanh toán thất bại — Booking: ${bookingId} | Code: ${responseCode}`
      );
    }

    // Luôn trả "00" để VNPay biết đã nhận IPN thành công (không retry)
    return res.json({ RspCode: "00", Message: "Confirm Success" });

  } catch (err) {
    // Không throw — phải trả JSON cho VNPay để tránh retry vô hạn
    console.error("[VNPay IPN] 🔥 Lỗi không mong đợi:", err.message, err.stack);
    return res.json({ RspCode: "99", Message: "Unknown Error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. getPaymentStatus
// GET /api/payment/status/:bookingId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Frontend polling: kiểm tra trạng thái thanh toán của một booking.
 *
 * Luồng dùng:
 *   1. Sau khi VNPay redirect về trang /payment/result
 *   2. Frontend gọi endpoint này để biết kết quả chính xác (IPN đã cập nhật chưa)
 *   3. Nếu paid → hiển thị danh sách vé + QR
 *
 * Yêu cầu: đăng nhập (chủ booking hoặc admin).
 */
exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).select(
    "user paymentStatus paymentMethod transactionId vnpayTxnRef finalPrice bookingStatus"
  );

  if (!booking) {
    return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
  }

  // Kiểm tra quyền: chủ booking hoặc admin
  const isOwner = booking.user?.toString() === req.user.id;
  const isAdmin  = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Bạn không có quyền xem thông tin này" });
  }

  // Nếu đã thanh toán → trả thêm danh sách vé (kèm QR và thông tin ghế)
  let tickets = [];
  if (booking.paymentStatus === "paid") {
    tickets = await Ticket.find({ booking: booking._id })
      .select("code qrCode status seat trip createdAt")
      .populate({
        path: "seat",
        populate: { path: "seat", select: "seatNumber row column type" },
      })
      .lean();
  }

  return res.json({
    bookingId:     booking._id,
    paymentStatus: booking.paymentStatus,  // "pending" | "paid" | "failed"
    paymentMethod: booking.paymentMethod,
    transactionId: booking.transactionId,
    vnpayTxnRef:   booking.vnpayTxnRef,
    finalPrice:    booking.finalPrice,
    bookingStatus: booking.bookingStatus,
    tickets,
  });
});
