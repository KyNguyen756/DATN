const Ticket = require("../models/ticketModel");
const Booking = require("../models/bookingModel");
const QRCode = require("qrcode");

exports.createTickets = async (req, res) => {

  const booking = await Booking.findById(req.params.bookingId);

  const tickets = [];

  for (let seatId of booking.seats) {

    const ticket = new Ticket({
      booking: booking._id,
      trip: booking.trip,
      seat: seatId
    });

    const qrData = JSON.stringify({
      ticketId: ticket._id
    });

    const qrCode = await QRCode.toDataURL(qrData);

    ticket.qrCode = qrCode;

    await ticket.save();

    tickets.push(ticket);

  }

  res.json(tickets);

};

exports.getMyTickets = async (req, res) => {

  const tickets = await Ticket.find()
    .populate({
      path: "booking",
      match: { user: req.user.id }
    })
    .populate("trip")
    .populate("seat");

  res.json(tickets);

};

exports.verifyTicket = async (req, res) => {

  const { ticketId } = req.body;

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return res.status(404).json({
      message: "Ticket not found"
    });
  }

  if (ticket.status !== "valid") {
    return res.status(400).json({
      message: "Ticket already used"
    });
  }

  ticket.status = "used";

  await ticket.save();

  res.json({
    message: "Ticket verified",
    ticket
  });

};
