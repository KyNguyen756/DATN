const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  seatNumber: {
    type: String,
    required: true
  },

  row: Number,

  column: Number,

  type: {
    type: String,
    enum: ["normal", "vip"],
    default: "normal"
  }

}, { timestamps: true });

module.exports = mongoose.model("Seat", seatSchema);
