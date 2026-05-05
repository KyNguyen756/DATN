const Booking = require("../models/bookingModel");
const TripSeat = require("../models/tripseatModel");
const Ticket = require("../models/ticketModel");
const Trip = require("../models/tripModel");
const Promotion = require("../models/promotionModel");
const asyncHandler = require("../utils/asyncHandler");
const QRCode = require("qrcode");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Generate a short human-readable ticket code. Retries up to 5 times on collision. */
async function generateUniqueTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "VXB-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const existing = await Ticket.findOne({ code });
    if (!existing) return code;
  }
  // Fallback: use a timestamp-derived suffix that is practically guaranteed unique
  return "VXB-" + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─────────────────────────────────────────────
// POST /api/bookings/checkout  (unified atomic checkout)
// Combines: validate promo → create booking → mark seats booked → generate tickets
// ─────────────────────────────────────────────
exports.checkout = asyncHandler(async (req, res) => {
  const {
    tripId,
    seatIds,
    passengerName,
    passengerPhone,
    passengerEmail,
    paymentMethod,
    note,
    promoCode          // optional
  } = req.body;

  if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds are required" });
  }

  // 1. Verify trip
  const trip = await Trip.findById(tripId).populate("bus");
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  // 2. Verify seats — all must be locked by THIS user
  const seats = await TripSeat.find({ _id: { $in: seatIds } }).populate("seat");
  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }

  for (const s of seats) {
    if (s.status !== "locked") {
      return res.status(400).json({ message: `Seat ${s.seat?.seatNumber || s._id} is not locked. Please re-select.` });
    }
    if (s.lockedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: `Seat ${s.seat?.seatNumber || s._id} is held by another user.` });
    }
    if (s.lockedUntil && s.lockedUntil < new Date()) {
      return res.status(400).json({ message: `Seat ${s.seat?.seatNumber || s._id} lock has expired. Please re-select.` });
    }
  }

  // 3. Calculate price (respect VIP seat multiplier server-side)
  const VIP_MULTIPLIER = 1.3;
  let totalPrice = 0;
  for (const s of seats) {
    const seatPrice = s.seat?.type === "vip" ? Math.round(trip.price * VIP_MULTIPLIER) : trip.price;
    totalPrice += seatPrice;
  }

  // 4. Handle promo code (if provided) — validate AND increment usedCount atomically
  let discountAmount = 0;
  let promotionId = null;

  if (promoCode) {
    const now = new Date();
    const promo = await Promotion.findOne({ code: promoCode.toUpperCase(), status: "active" });

    if (!promo) return res.status(404).json({ message: "Mã khuyến mãi không hợp lệ" });
    if (promo.expiresAt && promo.expiresAt < now) return res.status(400).json({ message: "Mã khuyến mãi đã hết hạn" });
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
    }
    if (totalPrice < promo.minOrderValue) {
      return res.status(400).json({ message: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ để dùng mã này` });
    }

    // Calculate discount
    if (promo.discountType === "percent") {
      discountAmount = Math.round((totalPrice * promo.discountValue) / 100);
      if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
    } else {
      discountAmount = Math.min(promo.discountValue, totalPrice);
    }
    promotionId = promo._id;

    // Atomically increment usedCount
    await Promotion.findByIdAndUpdate(promo._id, { $inc: { usedCount: 1 } });
  }

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  // 5. Create booking
  const booking = await Booking.create({
    user: req.user.id,
    trip: tripId,
    seats: seatIds,
    totalPrice,
    discountAmount,
    finalPrice,
    promotionId,
    paymentStatus: "pending",
    bookingStatus: "active",
    passengerName: passengerName || "",
    passengerPhone: passengerPhone || "",
    passengerEmail: passengerEmail || "",
    paymentMethod: paymentMethod || "cod",
    note: note || ""
  });

  // 6. Đánh dấu ghế đã đặt (locked → booked)
  await TripSeat.updateMany(
    { _id: { $in: seatIds } },
    { status: "booked", lockedBy: null, lockedUntil: null }
  );

  // 7. Tạo vé — CHỈ tạo ngay nếu KHÔNG phải thanh toán VNPay
  //
  //    • cod / cash / other → tạo vé ngay (thanh toán khi nhận hoặc tại quầy)
  //    • vnpay             → KHÔNG tạo vé ở đây
  //                          Vé sẽ được tạo tự động bởi IPN handler
  //                          (controllers/payment.controller.js → vnpayIPN)
  //                          khi VNPay xác nhận thanh toán thành công.
  //
  //    Lý do: tránh cấp vé hợp lệ cho đơn hàng chưa được thanh toán.

  let createdTickets = [];

  if ((paymentMethod || "cod") !== "vnpay") {
    // Thanh toán không qua VNPay → tạo vé ngay lập tức
    const ticketDocs = [];
    for (const seatDoc of seats) {
      const code = await generateUniqueTicketCode();
      const ticket = new Ticket({
        booking: booking._id,
        trip:    tripId,
        seat:    seatDoc._id,
        code,
      });
      const qrPayload = JSON.stringify({
        ticketId: ticket._id,
        code:     ticket.code,
        trip:     tripId,
        booking:  booking._id,
      });
      ticket.qrCode = await QRCode.toDataURL(qrPayload);
      ticketDocs.push(ticket);
    }
    createdTickets = await Ticket.insertMany(ticketDocs);
  }
  // else: vnpay → vé sẽ được tạo bởi IPN sau khi thanh toán xác nhận

  // 8. Trả về kết quả
  //    - tickets: [] nếu là vnpay (frontend biết cần chờ thanh toán xong)
  //    - requiresPayment: true → frontend redirect sang VNPay
  res.status(201).json({
    booking,
    tickets: createdTickets,
    requiresPayment: booking.paymentMethod === "vnpay",
    summary: {
      totalPrice,
      discountAmount,
      finalPrice,
      promoApplied: !!promoCode,
    },
  });
});

// ─────────────────────────────────────────────
// POST /api/bookings  (legacy / backwards-compat — kept for staff QuickSale)
// ─────────────────────────────────────────────
exports.createBooking = asyncHandler(async (req, res) => {
  const { tripId, seatIds, passengerName, passengerPhone, passengerEmail, paymentMethod, note } = req.body;

  if (!tripId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds are required" });
  }

  const trip = await Trip.findById(tripId).populate("bus");
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const seats = await TripSeat.find({ _id: { $in: seatIds } }).populate("seat");

  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }

  // Validate seats are locked by requesting user
  for (let seat of seats) {
    if (seat.status !== "locked") {
      return res.status(400).json({ message: `Seat ${seat.seat?.seatNumber || seat._id} is not locked` });
    }
    if (seat.lockedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: `Seat ${seat.seat?.seatNumber || seat._id} is locked by another user` });
    }
  }

  // VIP pricing
  const VIP_MULTIPLIER = 1.3;
  let totalPrice = 0;
  for (const s of seats) {
    totalPrice += s.seat?.type === "vip" ? Math.round(trip.price * VIP_MULTIPLIER) : trip.price;
  }

  const booking = await Booking.create({
    user: req.user.id,
    trip: tripId,
    seats: seatIds,
    totalPrice,
    discountAmount: 0,
    finalPrice: totalPrice,
    paymentStatus: "pending",
    bookingStatus: "active",
    passengerName: passengerName || "",
    passengerPhone: passengerPhone || "",
    passengerEmail: passengerEmail || "",
    paymentMethod: paymentMethod || "cod",
    note: note || ""
  });

  // Mark seats as booked
  await TripSeat.updateMany(
    { _id: { $in: seatIds } },
    { status: "booked", lockedBy: null, lockedUntil: null }
  );

  res.status(201).json(booking);
});

// GET /api/bookings/my-bookings
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation" },
        { path: "toStation" },
        { path: "bus" }
      ]
    })
    .populate({ path: "seats", populate: { path: "seat" } })
    .populate("promotionId", "code discountType discountValue")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// GET /api/bookings/:id  (owner or admin)
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation" },
        { path: "toStation" },
        { path: "bus" }
      ]
    })
    .populate({ path: "seats", populate: { path: "seat" } })
    .populate("user", "-password")
    .populate("promotionId", "code discountType discountValue");

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.user._id.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "staff") {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(booking);
});

// GET /api/bookings  (admin)
exports.getBookings = asyncHandler(async (req, res) => {
  const { date, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.bookingStatus = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  const bookings = await Booking.find(filter)
    .populate("user", "-password")
    .populate("trip")
    .populate("promotionId", "code")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Booking.countDocuments(filter);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
});

// DELETE /api/bookings/:id  (cancel)
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Only the owner or an admin can cancel
  if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Cannot cancel another user's booking" });
  }

  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  booking.bookingStatus = "cancelled";
  await booking.save();

  // Release seats back to available
  await TripSeat.updateMany(
    { _id: { $in: booking.seats } },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  // Cancel linked tickets
  await Ticket.updateMany(
    { booking: booking._id },
    { status: "cancelled" }
  );

  res.json({ message: "Booking cancelled" });
});

// ─────────────────────────────────────────────
// POST /api/bookings/counter  (staff counter sale)
// Staff can book for walk-in guests without seat locks.
// Requires: staffMiddleware  (admin or staff role)
// ─────────────────────────────────────────────
exports.counterSale = asyncHandler(async (req, res) => {
  const {
    tripId,
    seatIds,          // array of TripSeat ids
    guestName,
    guestPhone,
    guestEmail,
    userId,           // optional: link to existing user
    paymentMethod,
    note
  } = req.body;

  if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds are required" });
  }
  if (!guestName || !guestPhone) {
    return res.status(400).json({ message: "Tên và số điện thoại khách hàng là bắt buộc" });
  }

  // Verify trip
  const trip = await Trip.findById(tripId).populate("bus");
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  // Verify seats exist and are not already booked
  const seats = await TripSeat.find({ _id: { $in: seatIds } }).populate("seat");
  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }
  for (const s of seats) {
    if (s.status === "booked") {
      return res.status(400).json({ message: `Ghế ${s.seat?.seatNumber || s._id} đã được đặt.` });
    }
  }

  // VIP pricing server-side
  const VIP_MULTIPLIER = 1.3;
  let totalPrice = 0;
  for (const s of seats) {
    totalPrice += s.seat?.type === "vip" ? Math.round(trip.price * VIP_MULTIPLIER) : trip.price;
  }

  // Generate receipt number for counter sale
  const receiptNumber = "QT-" + Date.now().toString(36).toUpperCase();

  // Create booking — user is optional (null = guest)
  const booking = await Booking.create({
    user: userId || null,
    isGuestBooking: !userId,
    bookingSource: "counter",
    trip: tripId,
    seats: seatIds,
    totalPrice,
    discountAmount: 0,
    finalPrice: totalPrice,
    paymentStatus: "paid",        // Counter sales are paid immediately
    bookingStatus: "active",
    passengerName: guestName,
    passengerPhone: guestPhone,
    passengerEmail: guestEmail || "",
    paymentMethod: paymentMethod || "cash",
    note: note || "",
    receiptNumber
  });

  // Mark seats as booked (no lock check needed for counter sales)
  await TripSeat.updateMany(
    { _id: { $in: seatIds } },
    { status: "booked", lockedBy: null, lockedUntil: null }
  );

  // Generate tickets with QR codes
  const ticketDocs = [];
  for (const seatDoc of seats) {
    const code = await generateUniqueTicketCode();
    const ticket = new Ticket({
      booking: booking._id,
      trip: tripId,
      seat: seatDoc._id,
      code
    });
    const qrPayload = JSON.stringify({ ticketId: ticket._id, code: ticket.code, trip: tripId, receipt: receiptNumber });
    ticket.qrCode = await QRCode.toDataURL(qrPayload);
    ticketDocs.push(ticket);
  }

  const createdTickets = await Ticket.insertMany(ticketDocs);

  res.status(201).json({
    booking,
    tickets: createdTickets,
    receiptNumber,
    summary: { totalPrice, guestName, guestPhone, seatsCount: seatIds.length }
  });
});

