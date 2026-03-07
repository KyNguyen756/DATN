const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusModel",
    required: true
  },

  seatNumber: {
    type: String,
    required: true
  },

  row: {
    type: Number,
    required: true
  },

  column: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["normal", "vip"],
    default: "normal"
  }

}, { timestamps: true });

module.exports = mongoose.model("SeatModel", seatSchema);
