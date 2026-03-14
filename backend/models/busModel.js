const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  licensePlate: {
    type: String,
    required: true,
    unique: true
  },

  totalSeats: {
    type: Number,
    required: true
  },

  seatLayout: {
    rows: Number,
    columns: Number
  },

  type: {
    type: String,
    enum: ["seater", "sleeper", "limousine"],
    default: "seater"
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);
