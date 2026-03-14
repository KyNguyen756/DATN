const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true
  },

  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TripSeat",
    required: true
  },

  qrCode: {
    type: String
  },

  status: {
    type: String,
    enum: ["valid", "used", "cancelled"],
    default: "valid"
  }

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
