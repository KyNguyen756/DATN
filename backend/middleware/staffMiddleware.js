/**
 * Allows access to users with role 'admin' or 'staff'.
 * Must be used AFTER authMiddleware (requires req.user to be set).
 */
const staffMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin" && req.user.role !== "staff") {
    return res.status(403).json({ message: "Staff or Admin access required" });
  }

  next();
};

module.exports = staffMiddleware;
