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

  // The station this bus belongs to / is managed by
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    default: null
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

  amenities: {
    type: [String],
    default: []
  },

  driver: {
    type: String,
    default: ""
  },

  driverPhone: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["active", "maintenance", "inactive"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);

