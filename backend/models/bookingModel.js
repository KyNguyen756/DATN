const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  // user can be null for walk-in (counter) bookings
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    required: true
  },

  seats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TripSeat"
    }
  ],

  totalPrice: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  bookingStatus: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active"
  },

  // Passenger contact info (required for counter / walk-in)
  passengerName:  { type: String, default: "" },
  passengerPhone: { type: String, default: "" },
  passengerEmail: { type: String, default: "" },
  passengerIdCard: { type: String, default: "" }, // CCCD / CMND

  // Payment info
  paymentMethod: {
    type: String,
    enum: ["cod", "counter", "bank_transfer", "card", "online"],
    default: "cod"
  },
  note: { type: String, default: "" },

  // Counter sales tracking
  source: {
    type: String,
    enum: ["online", "counter"],
    default: "online"
  },

  // Staff who sold the ticket (populated from req.user at counter sale)
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
