const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip"
  },
  seatNumber: String,
  qrCode: String,
  status: {
    type: String,
    default: "active"
  }
});

module.exports = mongoose.model("Ticket", TicketSchema);
