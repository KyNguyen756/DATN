// backend/controllers/newsController.js
const News = require("../models/newsModel");
const asyncHandler = require("../utils/asyncHandler");
const { body, param, query, validationResult } = require("express-validator");

// ── Shared validation helpers ───────────────────────────────────────────────
const CATEGORIES = ["khuyen-mai", "thong-bao", "su-kien", "tin-tuc"];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Validation chains (exported for route files) ────────────────────────────
exports.validateCreate = [
  body("title")
    .trim()
    .notEmpty().withMessage("Tiêu đề là bắt buộc")
    .isLength({ max: 200 }).withMessage("Tiêu đề tối đa 200 ký tự"),
  body("summary")
    .trim()
    .notEmpty().withMessage("Tóm tắt là bắt buộc")
    .isLength({ max: 500 }).withMessage("Tóm tắt tối đa 500 ký tự"),
  body("content")
    .trim()
    .notEmpty().withMessage("Nội dung là bắt buộc"),
  body("category")
    .trim()
    .notEmpty().withMessage("Danh mục là bắt buộc")
    .isIn(CATEGORIES).withMessage(`Danh mục phải là: ${CATEGORIES.join(", ")}`),
  body("status")
    .optional()
    .isIn(["draft", "published"]).withMessage("Trạng thái phải là draft hoặc published"),
  body("isPinned")
    .optional()
    .isBoolean().withMessage("isPinned phải là boolean"),
  handleValidation,
];

exports.validateUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage("Tiêu đề từ 1-200 ký tự"),
  body("summary")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage("Tóm tắt từ 1-500 ký tự"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage("Nội dung không được rỗng"),
  body("category")
    .optional()
    .isIn(CATEGORIES).withMessage(`Danh mục phải là: ${CATEGORIES.join(", ")}`),
  body("status")
    .optional()
    .isIn(["draft", "published"]).withMessage("Trạng thái phải là draft hoặc published"),
  body("isPinned")
    .optional()
    .isBoolean().withMessage("isPinned phải là boolean"),
  handleValidation,
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/news
 * Create a new article. Thumbnail comes via multer (uploadMiddleware).
 */
exports.createNews = asyncHandler(async (req, res) => {
  const { title, summary, content, category, status, isPinned } = req.body;

  const newsData = {
    title,
    summary,
    content,
    category,
    status: status || "draft",
    isPinned: isPinned === "true" || isPinned === true,
    author: req.user.id,
    thumbnail: req.file?.path || null,
  };

  // If publishing immediately, set publishedAt
  if (newsData.status === "published") {
    newsData.publishedAt = new Date();
  }

  const news = await News.create(newsData);

  const populated = await News.findById(news._id).populate("author", "username email");

  res.status(201).json(populated);
});

/**
 * PUT /api/news/:id
 * Update an article's fields. Supports optional thumbnail replacement.
 */
exports.updateNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });

  // Whitelist allowed fields to prevent mass-assignment
  const allowed = ["title", "summary", "content", "category", "status", "isPinned"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "isPinned") {
        news[key] = req.body[key] === "true" || req.body[key] === true;
      } else {
        news[key] = req.body[key];
      }
    }
  }

  // Handle thumbnail replacement
  if (req.file?.path) {
    news.thumbnail = req.file.path;
  }

  // Handle publish timestamp
  if (news.status === "published" && !news.publishedAt) {
    news.publishedAt = new Date();
  }
  if (news.status === "draft") {
    news.publishedAt = null;
  }

  await news.save(); // triggers slug re-generation if title changed

  const populated = await News.findById(news._id).populate("author", "username email");
  res.json(populated);
});

/**
 * DELETE /api/news/:id
 */
exports.deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);
  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });
  res.json({ message: "Đã xóa bài viết thành công" });
});

/**
 * PATCH /api/news/:id/publish
 * Toggle status between draft ↔ published.
 */
exports.togglePublish = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });

  if (news.status === "published") {
    news.status = "draft";
    news.publishedAt = null;
  } else {
    news.status = "published";
    news.publishedAt = new Date();
  }

  await news.save();

  res.json({
    message: news.status === "published" ? "Đã xuất bản bài viết" : "Đã chuyển về nháp",
    news,
  });
});

/**
 * PATCH /api/news/:id/pin
 * Toggle isPinned flag.
 */
exports.togglePin = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });

  news.isPinned = !news.isPinned;
  await news.save();

  res.json({
    message: news.isPinned ? "Đã ghim bài viết" : "Đã bỏ ghim bài viết",
    news,
  });
});

/**
 * GET /api/news/admin/all
 * Admin: list ALL news (draft + published), with search/filter/pagination.
 */
exports.getAdminNews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const { status, category, search } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { summary: { $regex: escaped, $options: "i" } },
    ];
  }

  const [articles, total] = await Promise.all([
    News.find(filter)
      .populate("author", "username email")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    News.countDocuments(filter),
  ]);

  res.json({
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/news
 * Public: list published news. Pinned first, then by publishedAt desc.
 */
exports.getPublicNews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const { category } = req.query;

  const filter = { status: "published" };
  if (category && CATEGORIES.includes(category)) {
    filter.category = category;
  }

  const [articles, total] = await Promise.all([
    News.find(filter)
      .populate("author", "username")
      .select("-content") // Don't send full content in list view
      .sort({ isPinned: -1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    News.countDocuments(filter),
  ]);

  res.json({
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * GET /api/news/:slug
 * Public: fetch a single published article by slug.
 */
exports.getNewsBySlug = asyncHandler(async (req, res) => {
  const news = await News.findOne({
    slug: req.params.slug,
    status: "published",
  }).populate("author", "username");

  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });

  res.json(news);
});

/**
 * PATCH /api/news/:slug/view
 * Increment the view counter. Uses atomic $inc to avoid race conditions.
 */
exports.incrementViews = asyncHandler(async (req, res) => {
  const news = await News.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true, select: "views" }
  );

  if (!news) return res.status(404).json({ message: "Bài viết không tồn tại" });

  res.json({ views: news.views });
});
