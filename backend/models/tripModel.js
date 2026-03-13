const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({

  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusModel",
    required: true
  },

  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route"
  },

  departureLocation: {
    type: String,
    required: true
  },

  arrivalLocation: {
    type: String,
    required: true
  },

  departureTime: {
    type: Date,
    required: true
  },

  arrivalTime: {
    type: Date,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  availableSeats: {
    type: Number
  },

  status: {
    type: String,
    enum: ["available", "full", "cancelled"],
    default: "available"
  }

}, { timestamps: true });

module.exports = mongoose.model("TripModel", tripSchema);
