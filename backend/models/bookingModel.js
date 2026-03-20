const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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

  // Passenger contact info collected at checkout
  passengerName: { type: String, default: "" },
  passengerPhone: { type: String, default: "" },
  passengerEmail: { type: String, default: "" },
  paymentMethod: { type: String, default: "cod" },
  note: { type: String, default: "" }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
