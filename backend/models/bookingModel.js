const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  // null for guest/counter bookings
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  isGuestBooking: { type: Boolean, default: false },

  // 'online' = customer self-service, 'counter' = staff sold at window
  bookingSource: {
    type: String,
    enum: ["online", "counter"],
    default: "online"
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

  // Raw price before discount (sum of all seats' individual prices)
  totalPrice: {
    type: Number,
    required: true
  },

  // Discount amount applied (0 if no promo)
  discountAmount: {
    type: Number,
    default: 0
  },

  // Final price after discount = totalPrice - discountAmount
  finalPrice: {
    type: Number,
    required: true
  },

  // Promotion code used (if any)
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Promotion",
    default: null
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
  note: { type: String, default: "" },

  // Mã giao dịch VNPay trả về (vnp_TransactionNo) — dùng để đối soát hoàn tiền
  transactionId: { type: String, default: null },

  // vnp_TxnRef gửi lên VNPay (dạng bookingId_timestamp) — dùng để tra cứu GD
  vnpayTxnRef: { type: String, default: null },

  // Printed receipt number for counter sales
  receiptNumber: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
