const mongoose = require("mongoose");

const tripTemplateSchema = new mongoose.Schema({

  // ── Nhận diện ──────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, "Tên template không được để trống"],
    trim: true,
    // Ví dụ: "Sài Gòn - Đà Lạt sáng 7h"
  },

  busCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusCompany",
    required: [true, "Template phải thuộc về một nhà xe"],
  },

  // ── Tuyến đường ────────────────────────────────────────────────────────────
  fromStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: [true, "Bến đi là bắt buộc"],
  },

  toStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: [true, "Bến đến là bắt buộc"],
  },

  // ── Xe mặc định (optional — có thể override khi generate) ─────────────────
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    default: null,
  },

  // ── Giờ xuất phát mặc định ─────────────────────────────────────────────────
  departureHour: {
    type: Number,
    required: [true, "Giờ xuất phát là bắt buộc"],
    min: 0,
    max: 23,
  },

  departureMinute: {
    type: Number,
    required: [true, "Phút xuất phát là bắt buộc"],
    min: 0,
    max: 59,
  },

  // ── Thông tin chuyến ────────────────────────────────────────────────────────
  estimatedDuration: {
    type: Number,   // phút
    default: 0,
  },

  price: {
    type: Number,
    required: [true, "Giá vé là bắt buộc"],
    min: 0,
  },

  cancellationPolicy: {
    type: String,
    default: "Hủy trước 24h: hoàn 80%. Hủy trước 2h: hoàn 50%. Không hoàn sau khi xe xuất phát.",
  },

  // ── Lặp lịch ────────────────────────────────────────────────────────────────
  // daysOfWeek: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
  // [] (trống) = áp dụng mọi ngày khi bulk-generate
  daysOfWeek: {
    type: [{ type: Number, min: 0, max: 6 }],
    default: [],
  },

  isRecurring: {
    type: Boolean,
    default: false,
  },

  // Chuỗi mô tả lịch lặp đơn giản, ví dụ: "MON,WED,FRI"
  recurrenceRule: {
    type: String,
    default: "",
  },

  // ── Trạng thái ──────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
// Giúp tìm nhanh template theo công ty / tuyến
tripTemplateSchema.index({ busCompany: 1, status: 1 });
tripTemplateSchema.index({ fromStation: 1, toStation: 1 });

module.exports = mongoose.model("TripTemplate", tripTemplateSchema);
