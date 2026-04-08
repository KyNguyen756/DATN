const Promotion = require("../models/promotionModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/promotions  (admin)
exports.createPromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.create(req.body);
  res.status(201).json(promo);
});

// GET /api/promotions  (admin sees all; public sees only active & unexpired)
exports.getPromotions = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const filter = isAdmin ? {} : {
    status: "active",
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  const promos = await Promotion.find(filter).sort({ createdAt: -1 });
  res.json(promos);
});

// GET /api/promotions/:id  (admin)
exports.getPromotionById = asyncHandler(async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  if (!promo) return res.status(404).json({ message: "Promotion not found" });
  res.json(promo);
});

// PUT /api/promotions/:id  (admin)
exports.updatePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!promo) return res.status(404).json({ message: "Promotion not found" });
  res.json(promo);
});

// DELETE /api/promotions/:id  (admin)
exports.deletePromotion = asyncHandler(async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ message: "Promotion deleted" });
});

// POST /api/promotions/apply  — DRY-RUN: validate a code and return discount preview.
// NOTE: This does NOT increment usedCount. The actual increment happens in POST /api/bookings/checkout.
exports.applyPromotion = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) return res.status(400).json({ message: "Promotion code is required" });
  if (!orderTotal || orderTotal <= 0) return res.status(400).json({ message: "orderTotal is required" });

  const promo = await Promotion.findOne({ code: code.toUpperCase(), status: "active" });

  if (!promo) {
    return res.status(404).json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hiệu lực" });
  }

  // Check expiry
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return res.status(400).json({ message: "Mã khuyến mãi đã hết hạn" });
  }

  // Check usage limit
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ message: "Mã khuyến mãi đã hết lượt sử dụng" });
  }

  // Check minimum order
  if (orderTotal < promo.minOrderValue) {
    return res.status(400).json({
      message: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ để dùng mã này`
    });
  }

  // Calculate discount (preview only — does NOT save)
  let discountAmount;
  if (promo.discountType === "percent") {
    discountAmount = Math.round((orderTotal * promo.discountValue) / 100);
    if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
  } else {
    discountAmount = Math.min(promo.discountValue, orderTotal);
  }

  const finalTotal = Math.max(0, orderTotal - discountAmount);

  res.json({
    valid: true,
    code: promo.code,
    description: promo.description,
    label: promo.label,
    discountAmount,
    finalTotal,
    promotionId: promo._id
  });
});
