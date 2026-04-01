const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({

  // ── Feature 2: TripTemplate ref ────────────────────────────────────────────
  // null = chuyến thủ công (dữ liệu cũ hoạt động bình thường)
  // ObjectId = chuyến được generate từ TripTemplate
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TripTemplate",
    default: null,
  },

  // Ngày chạy thực tế (YYYY-MM-DD, lưu dưới dạng Date)
  // null = Trip cũ không dùng trường này
  tripDate: {
    type: Date,
    default: null,
  },

  // Giờ xuất phát thực tế (có thể khác departureTime do chậm trễ)
  actualDepartureTime: {
    type: Date,
    default: null,
  },

  // ── BusCompany (Feature 1) ──────────────────────────────────────────────────
  busCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusCompany",
    default: null,
  },

  // ── Tuyến đường ────────────────────────────────────────────────────────────
  fromStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },

  toStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },

  // ── Xe ─────────────────────────────────────────────────────────────────────
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },

  // ── Thời gian ──────────────────────────────────────────────────────────────
  departureTime: {
    type: Date,
    required: true,
  },

  arrivalTime: {
    type: Date,
  },

  estimatedDuration: {
    type: Number, // phút
    default: 0,
  },

  // ── Giá & Chính sách ───────────────────────────────────────────────────────
  price: {
    type: Number,
    required: true,
  },

  cancellationPolicy: {
    type: String,
    default: "Hủy trước 24h: hoàn 80%. Hủy trước 2h: hoàn 50%. Không hoàn sau khi xe xuất phát.",
  },

  // ── Trạng thái ─────────────────────────────────────────────────────────────
  // "completed" được thêm mới — Trip cũ với "active"/"cancelled" vẫn hợp lệ
  status: {
    type: String,
    enum: ["active", "cancelled", "completed"],
    default: "active",
  },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────

// Compound unique index ngăn generate trùng chuyến từ cùng 1 template.
//
// Giải thích:
//   - unique: true         → MongoDB đảm bảo không có 2 Trip trùng (template, departureTime)
//   - sparse: true         → Documents có template=null được BỎ QUA hoàn toàn khỏi index
//                            → Trip cũ (template=null) KHÔNG bị ràng buộc, hoạt động bình thường
//   - Nếu generate 2 lần cùng template + cùng departureTime → lỗi 11000 (duplicate key)
//
// Ví dụ:
//   Trip A: template=T1, departureTime=2026-04-01T07:00Z  → vào index ✅
//   Trip B: template=T1, departureTime=2026-04-01T07:00Z  → DUPLICATE ❌
//   Trip C: template=null, departureTime=anything          → bỏ qua (sparse) ✅
tripSchema.index(
  { template: 1, departureTime: 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_template_departure",
  }
);

// Index thường — tăng tốc filter theo công ty và trạng thái
tripSchema.index({ busCompany: 1, status: 1 });
tripSchema.index({ departureTime: 1 });
tripSchema.index({ fromStation: 1, toStation: 1, departureTime: 1 });

module.exports = mongoose.model("Trip", tripSchema);
