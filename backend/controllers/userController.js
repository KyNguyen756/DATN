const User = require("../models/userModel");
const UserProfile = require("../models/userProfileModel");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await UserProfile
    .findOne({ user: req.user.id })
    .populate("user", "-password");

  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json(profile);
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["firstName", "lastName", "phone", "dateOfBirth", "address"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    updates,
    { new: true, runValidators: true }
  ).populate("user", "-password");

  res.json(profile);
});

// POST /api/users/avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const avatarUrl = req.file.path; // Cloudinary URL via multer-storage-cloudinary

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    { avatar: avatarUrl },
    { new: true }
  );

  res.json({ avatar: avatarUrl, profile });
});

// GET /api/users  (admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(filter);
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

// PUT /api/users/:id/status  (admin — lock/unlock)
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "locked"].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'locked'" });
  }

  // Prevent admin from locking themselves
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "Cannot change your own status" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// DELETE /api/users/:id  (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Clean up profile too
  await UserProfile.findOneAndDelete({ user: req.params.id });

  res.json({ message: "User deleted" });
});
