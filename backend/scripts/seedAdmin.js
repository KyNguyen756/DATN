/**
 * Script tạo tài khoản admin
 * Chạy: node scripts/seedAdmin.js (từ thư mục backend)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const ADMIN = {
  firstName: "Admin",
  lastName: "System",
  username: "admin",
  email: "admin@example.com",
  password: "Admin123!",
  phoneNumber: "0900000000",
  cccd: "000000000001",
  role: "admin",
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const existing = await User.findOne({
      $or: [{ username: ADMIN.username }, { email: ADMIN.email }],
    });

    if (existing) {
      console.log("Tài khoản admin đã tồn tại. Cập nhật mật khẩu và role...");
      existing.password = await bcrypt.hash(ADMIN.password, 10);
      existing.role = "admin";
      await existing.save();
      console.log("Đã cập nhật tài khoản admin.");
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
      await User.create({
        ...ADMIN,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent("Admin System")}`,
      });
      console.log("Đã tạo tài khoản admin thành công!");
    }

    console.log("\n--- Thông tin đăng nhập Admin ---");
    console.log("Tên đăng nhập / Email:", ADMIN.username);
    console.log("Mật khẩu:", ADMIN.password);
    console.log("---------------------------------\n");
  } catch (error) {
    console.error("Lỗi:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
