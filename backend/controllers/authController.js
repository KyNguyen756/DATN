const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      username,
      email,
      password,
      birthDate,
      cccd,
      phoneNumber
    } = req.body;

    const q = [{ username: username || email }];
    if (email) q.push({ email });
    const exist = await User.findOne({ $or: q });

    if (exist) {
      return res.status(400).json("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cccdValue =
      cccd ||
      `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    let avatar;

    if (req.file) {
      avatar = req.file.path;
    } else {
      const fullName = `${firstName} ${lastName}`;
      avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    }

    const user = await User.create({
      avatar,
      firstName,
      lastName,
      username: username || email,
      email: email || username,
      password: hashedPassword,
      birthDate,
      cccd: cccdValue,
      phoneNumber
    });

    res.json(user);

  } catch (error) {
    if (error && error.code === 11000) {
      return res
        .status(400)
        .json("Email hoặc CCCD/CMND đã được sử dụng");
    }
    res.status(500).json("Internal server error");
  }
};

// LOGIN
exports.login = async (req, res) => {

  const { username, email, password } = req.body;
  const loginId = username || email;

  const user = await User.findOne({
    $or: [{ username: loginId }, { email: loginId }]
  });

  if (!user) {
    return res.status(404).json("User not found");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json("Wrong password");
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user
  });
};

// LOGIN ADMIN - Chỉ cho phép tài khoản role admin
exports.loginAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  const loginId = username || email;

  const user = await User.findOne({
    $or: [{ username: loginId }, { email: loginId }]
  });

  if (!user) {
    return res.status(404).json("User not found");
  }

  if (user.role !== "admin") {
    return res.status(403).json("Chỉ quản trị viên mới được đăng nhập trang quản trị");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json("Wrong password");
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user
  });
};

//CHANGE PASS
exports.changePassword = async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  const valid = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!valid) {
    return res.status(400).json("Wrong password");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;

  await user.save();

  res.json("Password updated");
};
