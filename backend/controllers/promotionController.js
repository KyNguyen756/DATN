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

// POST /api/promotions/apply  — validate a code and return discount
exports.applyPromotion = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) return res.status(400).json({ message: "Promotion code is required" });

  const promo = await Promotion.findOne({ code: code.toUpperCase(), status: "active" });

  if (!promo) {
    return res.status(404).json({ message: "Invalid or expired promotion code" });
  }

  // Check expiry
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return res.status(400).json({ message: "Promotion code has expired" });
  }

  // Check usage limit
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ message: "Promotion code usage limit reached" });
  }

  // Check minimum order
  if (orderTotal < promo.minOrderValue) {
    return res.status(400).json({
      message: `Minimum order value is ${promo.minOrderValue.toLocaleString()}đ`
    });
  }

  // Calculate discount
  let discountAmount;
  if (promo.discountType === "percent") {
    discountAmount = Math.round((orderTotal * promo.discountValue) / 100);
    if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
  } else {
    discountAmount = promo.discountValue;
  }

  const finalTotal = Math.max(0, orderTotal - discountAmount);

  res.json({
    valid: true,
    code: promo.code,
    description: promo.description,
    discountAmount,
    finalTotal,
    promotionId: promo._id
  });
});
