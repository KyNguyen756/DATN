const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  description: {
    type: String,
    default: ""
  },

  label: {
    type: String,
    default: ""  // e.g. "Giảm 20%"
  },

  discountType: {
    type: String,
    enum: ["percent", "fixed"],
    required: true
  },

  discountValue: {
    type: Number,
    required: true  // percent: 0-100; fixed: amount in VND
  },

  minOrderValue: {
    type: Number,
    default: 0  // minimum booking total to apply
  },

  maxDiscount: {
    type: Number,
    default: null  // cap on discount amount (null = no cap)
  },

  expiresAt: {
    type: Date
  },

  maxUses: {
    type: Number,
    default: null  // null = unlimited
  },

  usedCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Promotion", promotionSchema);
