const mongoose = require("mongoose");

const tripSeatSchema = new mongoose.Schema({

  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TripModel",
    required: true
  },

  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SeatModel",
    required: true
  },

  status: {
    type: String,
    enum: ["available", "locked", "booked"],
    default: "available"
  },

  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel"
  },

  lockedUntil: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("TripSeatModel", tripSeatSchema);
