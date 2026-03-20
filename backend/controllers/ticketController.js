const Ticket = require("../models/ticketModel");
const Booking = require("../models/bookingModel");
const QRCode = require("qrcode");
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

// POST /api/tickets/:bookingId
exports.createTickets = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // Only the booking owner or admin can create tickets
  if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Prevent double-creating tickets
  const existing = await Ticket.find({ booking: booking._id });
  if (existing.length > 0) {
    return res.status(400).json({ message: "Tickets already created for this booking" });
  }

  const tickets = [];

  for (let seatId of booking.seats) {
    const ticket = new Ticket({
      booking: booking._id,
      trip: booking.trip,
      seat: seatId,
      code: generateTicketCode()
    });

    const qrData = JSON.stringify({ ticketId: ticket._id, code: ticket.code });
    ticket.qrCode = await QRCode.toDataURL(qrData);

    await ticket.save();
    tickets.push(ticket);
  }

  res.json(tickets);
});

// GET /api/tickets/my
exports.getMyTickets = asyncHandler(async (req, res) => {
  // Find bookings that belong to this user first
  const bookingIds = await Booking.find({ user: req.user.id }).distinct("_id");

  const tickets = await Ticket.find({ booking: { $in: bookingIds } })
    .populate({
      path: "booking",
      select: "totalPrice paymentStatus bookingStatus passengerName passengerPhone"
    })
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation" },
        { path: "toStation" },
        { path: "bus" }
      ]
    })
    .populate({ path: "seat", populate: { path: "seat" } })
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// GET /api/tickets  (admin)
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const tickets = await Ticket.find()
    .populate({ path: "booking", populate: { path: "user", select: "-password" } })
    .populate({ path: "trip", populate: [{ path: "fromStation" }, { path: "toStation" }] })
    .populate({ path: "seat", populate: { path: "seat" } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Ticket.countDocuments();
  res.json({ tickets, total, page: Number(page), limit: Number(limit) });
});

// POST /api/tickets/verify
exports.verifyTicket = asyncHandler(async (req, res) => {
  const { ticketId, code } = req.body;

  const ticket = await Ticket.findOne(
    ticketId ? { _id: ticketId } : { code }
  ).populate("trip").populate("seat");

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (ticket.status !== "valid") {
    return res.status(400).json({ message: `Ticket is ${ticket.status}` });
  }

  ticket.status = "used";
  await ticket.save();

  res.json({ message: "Ticket verified successfully", ticket });
});
