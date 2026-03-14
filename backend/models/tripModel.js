const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({

  fromStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true
  },

  toStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true
  },

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  departureTime: {
    type: Date,
    required: true
  },

  arrivalTime: {
    type: Date
  },

  price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);
