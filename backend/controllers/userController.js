const User = require("../models/userModel");
const UserProfile = require("../models/userProfileModel");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/users/profile
// Returns a unified flat object: { _id, username, email, phone, role, status, createdAt, avatar, ... }
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  // Merge UserProfile fields if exists
  const profile = await UserProfile.findOne({ user: req.user.id });

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone || profile?.phone || "",
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    // UserProfile extras
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    dateOfBirth: profile?.dateOfBirth || null,
    address: profile?.address || "",
    avatar: profile?.avatar || null,
  });
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { username, email, phone, firstName, lastName, dateOfBirth, address } = req.body;

  // Update User model fields
  const userUpdates = {};
  if (username) userUpdates.username = username;
  if (email) userUpdates.email = email;
  if (phone !== undefined) userUpdates.phone = phone;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    userUpdates,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });

  // Update or create UserProfile
  const profileUpdates = {};
  if (phone !== undefined) profileUpdates.phone = phone;
  if (firstName !== undefined) profileUpdates.firstName = firstName;
  if (lastName !== undefined) profileUpdates.lastName = lastName;
  if (dateOfBirth !== undefined) profileUpdates.dateOfBirth = dateOfBirth;
  if (address !== undefined) profileUpdates.address = address;

  let profile = null;
  if (Object.keys(profileUpdates).length > 0) {
    profile = await UserProfile.findOneAndUpdate(
      { user: req.user.id },
      profileUpdates,
      { new: true, upsert: true }
    );
  }

  // Return the same flat shape as getProfile
  res.json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || profile?.phone || "",
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      avatar: profile?.avatar || null,
    }
  });
});

// PUT /api/users/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({ message: "Đổi mật khẩu thành công" });
});

// POST /api/users/avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const avatarUrl = req.file.path;

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    { avatar: avatarUrl },
    { new: true, upsert: true }
  );

  res.json({ avatar: avatarUrl, profile });
});

// GET /api/users  (admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  if (role) filter.role = role;

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * Number(limit))
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
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "Cannot change your own account status" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-password");
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

  await UserProfile.findOneAndDelete({ user: req.params.id });
  res.json({ message: "User deleted" });
});

// PUT /api/users/:id/role  (admin only)
// Allows admin to change another user's role (user / staff / admin)
exports.changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const ALLOWED_ROLES = ["user", "staff", "admin"];

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${ALLOWED_ROLES.join(", ")}` });
  }

  // Prevent admin from demoting themselves accidentally
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "Cannot change your own role" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

