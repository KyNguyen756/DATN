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

  lockedAt: {
    type: Date
  },

  lockedUntil: {
    type: Date
  }

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique: không thể có 2 TripSeat cùng trip + seat (bảo vệ tầng DB)
tripSeatSchema.index({ trip: 1, seat: 1 }, { unique: true, name: "unique_trip_seat" });
// Performance: query ghế theo chuyến + trạng thái (hay dùng nhất)
tripSeatSchema.index({ trip: 1, status: 1 });

module.exports = mongoose.model("TripSeat", tripSeatSchema);
