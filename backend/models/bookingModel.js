const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TripModel",
    required: true
  },

  seats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "TripSeatModel"
  }],

  totalPrice: {
    type: Number,
    required: true
  },

  passengerName: { type: String },
  passengerPhone: { type: String },
  passengerEmail: { type: String },

  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },

  paymentStatus: { type: String, default: "unpaid" }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
