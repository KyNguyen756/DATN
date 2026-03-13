const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  busNumber: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    enum: ["seater", "sleeper", "limousine", "chair", "vip"],
    default: "seater"
  },

  totalSeats: {
    type: Number,
    required: true
  },

  seatLayout: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("BusModel", busSchema);
