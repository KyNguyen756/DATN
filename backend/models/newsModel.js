// backend/models/newsModel.js
const mongoose = require("mongoose");

/**
 * Convert a Vietnamese title to a URL-friendly slug.
 * Handles diacritics (ắ→a, ế→e, …), special chars, and consecutive hyphens.
 */
function slugify(text) {
  const from = "àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";
  let slug = text.toLowerCase().trim();
  for (let i = 0; i < from.length; i++) {
    slug = slug.replace(new RegExp(from[i], "g"), to[i]);
  }
  return slug
    .replace(/[^a-z0-9\s-]/g, "")   // remove non-alphanumeric
    .replace(/[\s_]+/g, "-")         // spaces/underscores → hyphens
    .replace(/-+/g, "-")            // collapse consecutive hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài viết là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },

    slug: {
      type: String,
      unique: true,
    },

    summary: {
      type: String,
      required: [true, "Tóm tắt bài viết là bắt buộc"],
      maxlength: [500, "Tóm tắt không được vượt quá 500 ký tự"],
    },

    content: {
      type: String,
      required: [true, "Nội dung bài viết là bắt buộc"],
    },

    thumbnail: {
      type: String, // Cloudinary URL
      default: null,
    },

    category: {
      type: String,
      enum: {
        values: ["khuyen-mai", "thong-bao", "su-kien", "tin-tuc"],
        message: "Danh mục không hợp lệ",
      },
      required: [true, "Danh mục bài viết là bắt buộc"],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Auto-generate slug from title before validation ─────────────────────────
newsSchema.pre("validate", async function (next) {
  if (this.isModified("title") || !this.slug) {
    let baseSlug = slugify(this.title);
    if (!baseSlug) baseSlug = "bai-viet";

    // Ensure uniqueness by appending a short suffix on collision
    let candidate = baseSlug;
    let counter = 0;
    const News = this.constructor;

    while (true) {
      const existing = await News.findOne({
        slug: candidate,
        _id: { $ne: this._id }, // exclude self on update
      });
      if (!existing) break;
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    this.slug = candidate;
  }
  next();
});

// ── Indexes for read performance ────────────────────────────────────────────
// Note: slug already has a unique index from `unique: true` on the field.
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ isPinned: -1, publishedAt: -1 });

module.exports = mongoose.model("News", newsSchema);
