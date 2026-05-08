const crypto = require("crypto");
const qs = require("qs");
const Booking = require("../models/bookingModel");
const Ticket = require("../models/ticketModel");
const TripSeat = require("../models/tripseatModel");
const QRCode = require("qrcode");
const asyncHandler = require("../utils/asyncHandler");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Sort object keys alphabetically (required by VNPay checksum spec) */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

/** Generate VNPay-compatible date string: yyyyMMddHHmmss in Asia/Ho_Chi_Minh */
function vnpayDateFormat(date) {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Generate a unique VNPay txn ref: timestamp + random suffix */
function generateTxnRef() {
  const now = Date.now();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${now}${random}`;
}

/** Generate unique ticket code */
async function generateUniqueTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "VXB-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const existing = await Ticket.findOne({ code });
    if (!existing) return code;
  }
  return "VXB-" + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─────────────────────────────────────────────
// POST /api/vnpay/create-payment-url
// Creates VNPay payment URL for an existing booking
// Body: { bookingId }
// ─────────────────────────────────────────────
exports.createPaymentUrl = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Only the booking owner can pay
  if (booking.user?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ message: "Booking already paid" });
  }

  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Booking is cancelled" });
  }

  if (booking.paymentMethod !== "vnpay") {
    return res.status(400).json({ message: "Booking payment method is not VNPay" });
  }

  // Generate unique txn ref if not already set
  let txnRef = booking.vnpTxnRef;
  if (!txnRef) {
    txnRef = generateTxnRef();
    booking.vnpTxnRef = txnRef;
    await booking.save();
  }

  // Build VNPay params
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL;

  const ipAddr = req.headers["x-forwarded-for"]
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || "127.0.0.1";

  const now = new Date();
  const createDate = vnpayDateFormat(now);
  const expireDate = vnpayDateFormat(new Date(now.getTime() + 15 * 60 * 1000)); // 15 min

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = txnRef;
  vnp_Params["vnp_OrderInfo"] = `Thanh toan ve xe - Booking ${booking._id}`;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = booking.finalPrice * 100; // VNPay requires amount * 100
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = expireDate;

  // Sort and sign
  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

  res.json({
    paymentUrl,
    bookingId: booking._id,
    txnRef
  });
});

// ─────────────────────────────────────────────
// GET /api/vnpay/return
// VNPay return URL — THE SINGLE payment processing endpoint.
//
// This endpoint:
//   1. Verifies VNPay checksum (HMAC-SHA512)
//   2. Validates amount matches DB
//   3. Updates booking status (idempotent — skips if already processed)
//   4. Creates tickets + QR codes on success
//   5. Releases seats on failure
//   6. Returns full booking data for frontend display
//
// IDEMPOTENCY:
//   - Uses `paymentStatus` as a state gate.
//   - If booking is already "paid" → returns existing tickets (no duplicates).
//   - If booking is already "failed" → returns failure info.
//   - Only processes when `paymentStatus === "pending"`.
// ─────────────────────────────────────────────
exports.vnpayReturn = asyncHandler(async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  // Remove hash fields before checksum verification
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // 1. Verify checksum
  const isValid = secureHash === signed;
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const txnRef = vnp_Params["vnp_TxnRef"];

  if (!isValid) {
    console.error(`[VNPay Return] Invalid checksum for txnRef: ${txnRef}`);
    return res.json({
      isValid: false,
      isSuccess: false,
      booking: null,
      tickets: [],
      message: "Chữ ký không hợp lệ. Dữ liệu có thể bị giả mạo."
    });
  }

  // 2. Find booking
  const booking = await Booking.findOne({ vnpTxnRef: txnRef });
  if (!booking) {
    console.error(`[VNPay Return] Booking not found for txnRef: ${txnRef}`);
    return res.json({
      isValid: true,
      isSuccess: false,
      booking: null,
      tickets: [],
      message: "Không tìm thấy đơn đặt vé tương ứng."
    });
  }

  // 3. Determine VNPay payment result
  const isPaymentSuccess = responseCode === "00";

  // ── IDEMPOTENT CHECK ──────────────────────────────────────
  // If already processed, just return current state (no DB mutation)
  if (booking.paymentStatus === "paid") {
    // Already paid — return existing booking + tickets (refresh-safe)
    console.log(`[VNPay Return] Already paid, returning existing data: ${txnRef}`);

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "trip",
        populate: [
          { path: "fromStation" },
          { path: "toStation" },
          { path: "bus" }
        ]
      })
      .populate({ path: "seats", populate: { path: "seat" } });

    const tickets = await Ticket.find({ booking: booking._id });

    return res.json({
      isValid: true,
      isSuccess: true,
      responseCode,
      txnRef,
      booking: populatedBooking,
      tickets,
      amount: booking.finalPrice,
      bankCode: booking.vnpBankCode,
      transactionNo: booking.vnpTransactionNo,
      message: "Thanh toán thành công"
    });
  }

  if (booking.paymentStatus === "failed") {
    // Already failed — return failure info (refresh-safe)
    console.log(`[VNPay Return] Already failed, returning existing data: ${txnRef}`);

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "trip",
        populate: [
          { path: "fromStation" },
          { path: "toStation" },
          { path: "bus" }
        ]
      })
      .populate({ path: "seats", populate: { path: "seat" } });

    return res.json({
      isValid: true,
      isSuccess: false,
      responseCode: booking.vnpResponseCode,
      txnRef,
      booking: populatedBooking,
      tickets: [],
      amount: booking.finalPrice,
      message: "Thanh toán thất bại"
    });
  }

  // ── FIRST-TIME PROCESSING (paymentStatus === "pending") ───

  // 4. Validate amount
  const vnpAmount = parseInt(vnp_Params["vnp_Amount"]) / 100;
  if (booking.finalPrice !== vnpAmount) {
    console.error(`[VNPay Return] Amount mismatch: expected ${booking.finalPrice}, got ${vnpAmount}`);
    return res.json({
      isValid: true,
      isSuccess: false,
      booking: null,
      tickets: [],
      message: "Số tiền không khớp. Vui lòng liên hệ hỗ trợ."
    });
  }

  if (isPaymentSuccess) {
    // ── SUCCESS: update booking + create tickets ──
    booking.paymentStatus = "paid";
    booking.vnpTransactionNo = vnp_Params["vnp_TransactionNo"] || null;
    booking.vnpBankCode = vnp_Params["vnp_BankCode"] || null;
    booking.vnpResponseCode = responseCode;
    booking.paidAt = new Date();
    await booking.save();

    // Generate tickets
    const seatDocs = await TripSeat.find({ _id: { $in: booking.seats } }).populate("seat");
    const ticketDocs = [];
    for (const seatDoc of seatDocs) {
      const code = await generateUniqueTicketCode();
      const ticket = new Ticket({
        booking: booking._id,
        trip: booking.trip,
        seat: seatDoc._id,
        code
      });
      const qrPayload = JSON.stringify({
        ticketId: ticket._id,
        code: ticket.code,
        trip: booking.trip
      });
      ticket.qrCode = await QRCode.toDataURL(qrPayload);
      ticketDocs.push(ticket);
    }
    if (ticketDocs.length > 0) {
      await Ticket.insertMany(ticketDocs);
    }

    console.log(`[VNPay Return] Payment SUCCESS — booking: ${booking._id}, txnRef: ${txnRef}`);

    // Return populated booking + fresh tickets
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "trip",
        populate: [
          { path: "fromStation" },
          { path: "toStation" },
          { path: "bus" }
        ]
      })
      .populate({ path: "seats", populate: { path: "seat" } });

    return res.json({
      isValid: true,
      isSuccess: true,
      responseCode,
      txnRef,
      booking: populatedBooking,
      tickets: ticketDocs,
      amount: booking.finalPrice,
      bankCode: vnp_Params["vnp_BankCode"] || null,
      transactionNo: vnp_Params["vnp_TransactionNo"] || null,
      message: "Thanh toán thành công"
    });

  } else {
    // ── FAILED: update booking + release seats ──
    booking.paymentStatus = "failed";
    booking.vnpResponseCode = responseCode;
    await booking.save();

    // Release seats back to available
    await TripSeat.updateMany(
      { _id: { $in: booking.seats } },
      { status: "available", lockedBy: null, lockedUntil: null }
    );

    console.log(`[VNPay Return] Payment FAILED — booking: ${booking._id}, code: ${responseCode}`);

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "trip",
        populate: [
          { path: "fromStation" },
          { path: "toStation" },
          { path: "bus" }
        ]
      })
      .populate({ path: "seats", populate: { path: "seat" } });

    return res.json({
      isValid: true,
      isSuccess: false,
      responseCode,
      txnRef,
      booking: populatedBooking,
      tickets: [],
      amount: booking.finalPrice,
      bankCode: vnp_Params["vnp_BankCode"] || null,
      message: "Thanh toán thất bại"
    });
  }
});
