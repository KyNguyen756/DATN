const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Apply a promo code (any authenticated user)
router.post("/apply", authMiddleware, promotionController.applyPromotion);

// Public: list active promotions (for homepage promo section)
router.get("/", promotionController.getPromotions);

// Admin CRUD
router.post("/", authMiddleware, adminMiddleware, promotionController.createPromotion);
router.get("/:id", authMiddleware, adminMiddleware, promotionController.getPromotionById);
router.put("/:id", authMiddleware, adminMiddleware, promotionController.updatePromotion);
router.delete("/:id", authMiddleware, adminMiddleware, promotionController.deletePromotion);

module.exports = router;
