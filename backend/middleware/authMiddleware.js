const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * authMiddleware — validates JWT and attaches live user to req.user
 *
 * Security improvements over v1:
 * 1. Distinguishes expired vs invalid tokens (granular error messages)
 * 2. Reloads user from DB on every request — catches locked/deleted accounts
 * 3. Rejects locked accounts even if token is still valid
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reload from DB to catch locked/deleted accounts (prevents stale-token access)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }
    if (user.status === "locked") {
      return res.status(403).json({ message: "Account is locked. Contact support." });
    }

    req.user = { id: user._id.toString(), role: user.role, username: user.username };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired — please log in again", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token", code: "TOKEN_INVALID" });
  }
};
