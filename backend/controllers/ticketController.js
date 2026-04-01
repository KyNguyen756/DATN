const Ticket  = require("../models/ticketModel");
const Booking = require("../models/bookingModel");
const QRCode  = require("qrcode");
const asyncHandler = require("../utils/asyncHandler");

// Generate short human-readable code like "VXB-A3F9K2"
function generateTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "VXB-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Full populate for ticket (used for print template) ────────────────────
const TICKET_PRINT_POPULATE = [
  {
    path: "booking",
    select: "passengerName passengerPhone passengerEmail passengerIdCard totalPrice paymentStatus bookingStatus paymentMethod source soldBy",
    populate: { path: "soldBy", select: "username email" }
  },
  {
    path: "trip",
    populate: [
      { path: "fromStation", select: "name city address" },
      { path: "toStation",   select: "name city address" },
      { path: "bus",         select: "name licensePlate type totalSeats driver driverPhone" },
      { path: "busCompany",  select: "name shortName logo" },
    ]
  },
  {
    path: "seat",
    populate: { path: "seat", select: "seatNumber seatType" }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/:bookingId
// Creates tickets for an existing booking.
// Supports both:
//   - Online bookings (booking.user === req.user.id)
//   - Counter bookings (booking.user === null, sold by staff)
// ─────────────────────────────────────────────────────────────────────────────
exports.createTickets = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // Authorization: owner OR staff/admin who sold it OR any admin
  const isOwner    = booking.user?.toString() === req.user.id;
  const isSeller   = booking.soldBy?.toString() === req.user.id;
  const isAdmin    = req.user.role === "admin";
  const isStaff    = req.user.role === "staff";
  const isWalkIn   = !booking.user; // counter booking has no user account

  if (!isOwner && !isSeller && !isAdmin && !(isStaff && isWalkIn)) {
    return res.status(403).json({ message: "Not authorized to create tickets for this booking" });
  }

  // Prevent double-creating tickets
  const existing = await Ticket.find({ booking: booking._id });
  if (existing.length > 0) {
    // Return existing tickets instead of erroring (idempotent)
    const populated = await Ticket.find({ booking: booking._id }).populate(TICKET_PRINT_POPULATE);
    return res.json({ tickets: populated, alreadyExisted: true });
  }

  const tickets = [];

  for (let seatId of booking.seats) {
    const ticket = new Ticket({
      booking: booking._id,
      trip: booking.trip,
      seat: seatId,
      code: generateTicketCode()
    });

    const qrData = JSON.stringify({
      ticketId: ticket._id,
      code: ticket.code,
      trip: booking.trip,
    });
    ticket.qrCode = await QRCode.toDataURL(qrData);
    await ticket.save();
    tickets.push(ticket._id);
  }

  const populated = await Ticket.find({ _id: { $in: tickets } }).populate(TICKET_PRINT_POPULATE);
  res.json({ tickets: populated });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/my
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyTickets = asyncHandler(async (req, res) => {
  const bookingIds = await Booking.find({ user: req.user.id }).distinct("_id");

  const tickets = await Ticket.find({ booking: { $in: bookingIds } })
    .populate(TICKET_PRINT_POPULATE)
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets  (admin + staff)
// Staff see tickets for their company's trips only
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, source, date } = req.query;

  const filter = {};

  // Date filter on booking createdAt
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    const bookingIds = await Booking.find({
      createdAt: { $gte: start, $lt: end },
      ...(source ? { source } : {})
    }).distinct("_id");
    filter.booking = { $in: bookingIds };
  } else if (source) {
    const bookingIds = await Booking.find({ source }).distinct("_id");
    filter.booking = { $in: bookingIds };
  }

  // Staff: scope to their company
  if (req.user.role === "staff" && req.user.busCompany?._id) {
    const Trip = require("../models/tripModel");
    const trips = await Trip.find({ busCompany: req.user.busCompany._id }).select("_id");
    filter.trip = { $in: trips.map(t => t._id) };
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate(TICKET_PRINT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Ticket.countDocuments(filter)
  ]);

  res.json({ tickets, total, page: Number(page), limit: Number(limit) });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/verify  (staff/admin — check-in scan)
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyTicket = asyncHandler(async (req, res) => {
  const { ticketId, code } = req.body;

  if (!ticketId && !code) {
    return res.status(400).json({ message: "Provide ticketId or code" });
  }

  const ticket = await Ticket.findOne(
    ticketId ? { _id: ticketId } : { code }
  ).populate(TICKET_PRINT_POPULATE);

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (ticket.status === "used") {
    return res.status(400).json({ message: "Ticket already used (checked in)", ticket });
  }
  if (ticket.status === "cancelled") {
    return res.status(400).json({ message: "Ticket is cancelled", ticket });
  }

  ticket.status = "used";
  await ticket.save();

  res.json({ message: "Check-in successful", ticket });
});
