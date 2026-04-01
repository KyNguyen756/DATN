const Booking = require("../models/bookingModel");
const TripSeat = require("../models/tripseatModel");
const Ticket   = require("../models/ticketModel");
const Trip     = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// ── Shared populate for booking queries ────────────────────────────────────
const BOOKING_POPULATE = [
  { path: "user", select: "username email" },
  {
    path: "trip",
    populate: [
      { path: "fromStation", select: "name city address" },
      { path: "toStation",   select: "name city address" },
      { path: "bus",         select: "name licensePlate type totalSeats driver driverPhone busCompany" },
      { path: "busCompany",  select: "name shortName logo" },
    ]
  },
  { path: "seats", populate: { path: "seat", select: "seatNumber seatType" } },
  { path: "soldBy", select: "username email" },
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings
// Standard online booking — requires authenticated user.
// All seats must be locked by the requesting user.
// ─────────────────────────────────────────────────────────────────────────────
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    tripId, seatIds,
    passengerName, passengerPhone, passengerEmail,
    paymentMethod, note
  } = req.body;

  if (!tripId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds are required" });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const seats = await TripSeat.find({ _id: { $in: seatIds } });
  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }

  const now = new Date();

  // Validate each seat: must be locked by THIS user AND lock not expired
  for (let seat of seats) {
    if (seat.status === "booked") {
      return res.status(409).json({ message: `Ghế ${seat._id} đã được đặt bởi người khác.` });
    }
    if (seat.status !== "locked") {
      return res.status(400).json({ message: `Ghế ${seat._id} chưa được giữ. Vui lòng chọn và giữ chỗ trước.` });
    }
    if (seat.lockedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: `Ghế ${seat._id} đang được giữ bởi người khác.` });
    }
    if (seat.lockedUntil < now) {
      return res.status(400).json({ message: `Phiên giữ ghế đã hết hạn. Vui lòng chọn lại ghế.` });
    }
  }

  const booking = await Booking.create({
    user: req.user.id,
    trip: tripId,
    seats: seatIds,
    totalPrice: trip.price * seatIds.length,
    paymentStatus: "paid",
    bookingStatus: "active",
    passengerName:  passengerName  || "",
    passengerPhone: passengerPhone || "",
    passengerEmail: passengerEmail || "",
    paymentMethod:  paymentMethod  || "cod",
    note: note || "",
    source: "online",
  });

  // Atomic: chỉ mark booked những ghế thực sự đang locked bởi user này
  // (tránh race condition nếu lock vừa bị release bởi process khác)
  const updateResult = await TripSeat.updateMany(
    {
      _id: { $in: seatIds },
      status: "locked",
      lockedBy: req.user.id,
      lockedUntil: { $gte: now }
    },
    { $set: { status: "booked", lockedBy: null, lockedAt: null, lockedUntil: null } }
  );

  if (updateResult.modifiedCount !== seatIds.length) {
    // Một số ghế bị mất lock → rollback booking
    await Booking.findByIdAndDelete(booking._id);
    return res.status(409).json({ message: "Một số ghế đã hết hạn giữ chỗ trong khi xử lý. Vui lòng thử lại." });
  }

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);
  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings/counter
// Counter sale — staff/admin only.
// Walk-in booking: user can be null, requires passengerName + passengerPhone.
// Automatically generates tickets after booking.
// ─────────────────────────────────────────────────────────────────────────────
exports.createCounterBooking = asyncHandler(async (req, res) => {
  const {
    tripId, seatIds,
    passengerName, passengerPhone, passengerEmail, passengerIdCard,
    paymentMethod, note
  } = req.body;

  // Validation
  if (!tripId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds (array) are required" });
  }
  if (!passengerName || !passengerPhone) {
    return res.status(400).json({ message: "passengerName and passengerPhone are required for counter bookings" });
  }
  if (!/^[0-9]{9,11}$/.test(passengerPhone.replace(/\s/g, ""))) {
    return res.status(400).json({ message: "passengerPhone must be 9-11 digits" });
  }
  if (seatIds.length > 5) {
    return res.status(400).json({ message: "Maximum 5 seats per counter booking" });
  }

  const trip = await Trip.findById(tripId)
    .populate("bus", "name licensePlate type totalSeats driver driverPhone busCompany")
    .populate("busCompany", "name shortName logo");
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  // Staff busCompany scope check
  if (req.user.role === "staff" && req.user.busCompany?._id) {
    const tripCompany = trip.busCompany?._id?.toString() || trip.busCompany?.toString();
    if (tripCompany !== req.user.busCompany._id.toString()) {
      return res.status(403).json({ message: "Trip belongs to a different company" });
    }
  }

  const seats = await TripSeat.find({ _id: { $in: seatIds } });
  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }

  // For counter sales: seats must be locked by this staff member
  // OR available (staff can book directly without pre-locking)
  for (let seat of seats) {
    if (seat.status === "booked") {
      return res.status(409).json({ message: `Seat ${seat._id} is already booked` });
    }
    if (seat.status === "locked" && seat.lockedBy?.toString() !== req.user.id) {
      // Another user has this seat locked
      if (seat.lockedUntil > new Date()) {
        return res.status(409).json({ message: `Seat is held by another user. Please wait or choose a different seat.` });
      }
      // Lock has expired — treat as available
    }
  }

  const booking = await Booking.create({
    user: null,  // walk-in — no user account
    trip: tripId,
    seats: seatIds,
    totalPrice: trip.price * seatIds.length,
    paymentStatus: "paid",   // counter sale = immediate payment
    bookingStatus: "active",
    passengerName:   passengerName,
    passengerPhone:  passengerPhone,
    passengerEmail:  passengerEmail  || "",
    passengerIdCard: passengerIdCard || "",
    paymentMethod:   paymentMethod   || "counter",
    note: note || "",
    source: "counter",
    soldBy: req.user.id,
  });

  // Mark seats as booked
  await TripSeat.updateMany(
    { _id: { $in: seatIds } },
    { status: "booked", lockedBy: null, lockedAt: null, lockedUntil: null }
  );

  // Auto-generate tickets (counter sale = immediate ticket creation)
  const QRCode = require("qrcode");
  const tickets = [];

  for (let seatId of seatIds) {
    const code = generateTicketCode();
    const ticket = new (require("../models/ticketModel"))({
      booking: booking._id,
      trip: tripId,
      seat:  seatId,
      code,
    });
    const qrData = JSON.stringify({ ticketId: ticket._id, code, soldAt: "counter" });
    ticket.qrCode = await QRCode.toDataURL(qrData);
    await ticket.save();
    tickets.push(ticket);
  }

  // Return full populated booking + tickets for print
  const populated = await Booking.findById(booking._id)
    .populate({
      path: "user", select: "username email"
    })
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation", select: "name city address" },
        { path: "toStation",   select: "name city address" },
        { path: "bus",         select: "name licensePlate type totalSeats driver driverPhone" },
        { path: "busCompany",  select: "name shortName logo" },
      ]
    })
    .populate({ path: "seats", populate: { path: "seat", select: "seatNumber seatType" } })
    .populate({ path: "soldBy", select: "username email" });

  const populatedTickets = await require("../models/ticketModel")
    .find({ booking: booking._id })
    .populate({ path: "seat", populate: { path: "seat", select: "seatNumber seatType" } });

  res.status(201).json({
    booking: populated,
    tickets: populatedTickets,
    summary: {
      totalSeats: seatIds.length,
      totalPrice: booking.totalPrice,
      paymentMethod: booking.paymentMethod,
      source: "counter",
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/my-bookings
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate(BOOKING_POPULATE)
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings  (admin + staff)
// Staff see counter sales (soldBy) for their company
// ─────────────────────────────────────────────────────────────────────────────
exports.getBookings = asyncHandler(async (req, res) => {
  const { date, status, source, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.bookingStatus = status;
  if (source) filter.source = source;

  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  // Staff see only bookings for their company's trips
  if (req.user.role === "staff" && req.user.busCompany?._id) {
    const trips = await Trip.find({ busCompany: req.user.busCompany._id }).select("_id");
    filter.trip = { $in: trips.map(t => t._id) };
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Booking.countDocuments(filter)
  ]);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/bookings/:id  (owner, staff, or admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const isOwner  = booking.user?.toString() === req.user.id;
  const isStaff  = req.user.role === "staff" || req.user.role === "admin";
  const isSeller = booking.soldBy?.toString() === req.user.id;

  if (!isOwner && !isStaff && !isSeller) {
    return res.status(403).json({ message: "Cannot cancel this booking" });
  }

  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  booking.bookingStatus = "cancelled";
  await booking.save();

  // Release seats back to available
  await TripSeat.updateMany(
    { _id: { $in: booking.seats } },
    { status: "available", lockedBy: null, lockedAt: null, lockedUntil: null }
  );

  // Cancel linked tickets
  await Ticket.updateMany({ booking: booking._id }, { status: "cancelled" });

  res.json({ message: "Booking cancelled" });
});

// ── Helper ─────────────────────────────────────────────────────────────────
function generateTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "VXB-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
