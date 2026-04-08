const Ticket = require("../models/ticketModel");
const Booking = require("../models/bookingModel");
const QRCode = require("qrcode");
const asyncHandler = require("../utils/asyncHandler");

// Generate unique ticket code with collision retry
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

// POST /api/tickets/:bookingId  (legacy — kept for backward compat with staff QuickSale)
exports.createTickets = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.user.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "staff") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Prevent double-creating tickets
  const existing = await Ticket.find({ booking: booking._id });
  if (existing.length > 0) {
    return res.status(400).json({ message: "Tickets already created for this booking" });
  }

  const ticketDocs = [];

  for (let seatId of booking.seats) {
    const code = await generateUniqueTicketCode();
    const ticket = new Ticket({
      booking: booking._id,
      trip: booking.trip,
      seat: seatId,
      code
    });

    const qrData = JSON.stringify({ ticketId: ticket._id, code: ticket.code, trip: booking.trip });
    ticket.qrCode = await QRCode.toDataURL(qrData);
    ticketDocs.push(ticket);
  }

  // Use insertMany for efficiency
  const created = await Ticket.insertMany(ticketDocs);

  res.json(created);
});

// ─── Common deep populate for ticket queries ──────────────────────────────────
const TICKET_POPULATE = [
  {
    path: "booking",
    select: "totalPrice finalPrice discountAmount paymentStatus bookingStatus passengerName passengerPhone paymentMethod promotionId",
    populate: { path: "promotionId", select: "code discountType discountValue" }
  },
  {
    path: "trip",
    populate: [
      { path: "fromStation", select: "name city address" },
      { path: "toStation", select: "name city address" },
      { path: "bus", select: "name type licensePlate driver driverPhone amenities" }
    ]
  },
  {
    path: "seat",
    populate: { path: "seat", select: "seatNumber row column type" }
  }
];

// GET /api/tickets/my
exports.getMyTickets = asyncHandler(async (req, res) => {
  const bookingIds = await Booking.find({ user: req.user.id }).distinct("_id");

  const tickets = await Ticket.find({ booking: { $in: bookingIds } })
    .populate(TICKET_POPULATE)
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// GET /api/tickets  (admin)
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const tickets = await Ticket.find(filter)
    .populate({ path: "booking", populate: { path: "user", select: "-password" } })
    .populate({ path: "trip", populate: [{ path: "fromStation" }, { path: "toStation" }] })
    .populate({ path: "seat", populate: { path: "seat" } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Ticket.countDocuments(filter);
  res.json({ tickets, total, page: Number(page), limit: Number(limit) });
});

// POST /api/tickets/verify  (staff check-in)
exports.verifyTicket = asyncHandler(async (req, res) => {
  const { ticketId, code } = req.body;

  const ticket = await Ticket.findOne(
    ticketId ? { _id: ticketId } : { code }
  )
    .populate(TICKET_POPULATE);

  if (!ticket) return res.status(404).json({ message: "Không tìm thấy vé" });

  if (ticket.status === "used") {
    return res.status(400).json({ message: "Vé này đã được sử dụng", ticket });
  }

  if (ticket.status === "cancelled") {
    return res.status(400).json({ message: "Vé đã bị hủy", ticket });
  }

  ticket.status = "used";
  await ticket.save();

  res.json({ message: "Check-in thành công!", ticket });
});
