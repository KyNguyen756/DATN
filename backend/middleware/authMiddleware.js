const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json("Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json("Unauthorized");
  }
};

// Chỉ cho phép user có role admin
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json("Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json("Chỉ quản trị viên mới được thực hiện thao tác này");
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
