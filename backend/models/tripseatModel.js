const mongoose = require("mongoose");

const tripSeatSchema = new mongoose.Schema({

  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true
  },

  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seat",
    required: true
  },

  status: {
    type: String,
    enum: ["available", "locked", "booked"],
    default: "available"
  },

  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  lockedUntil: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("TripSeat", tripSeatSchema);
