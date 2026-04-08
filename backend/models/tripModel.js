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

  estimatedDuration: {
    type: Number, // duration in minutes
    default: 0
  },

  price: {
    type: Number,
    required: true
  },

  cancellationPolicy: {
    type: String,
    default: "Hủy trước 24h: hoàn 80%. Hủy trước 2h: hoàn 50%. Không hoàn sau khi xe xuất phát."
  },

  status: {
    type: String,
    enum: ["scheduled", "active", "ongoing", "completed", "cancelled"],
    default: "scheduled"
  }

}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);
