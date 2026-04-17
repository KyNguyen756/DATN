/**
 * authorizeRoles(...roles)
 * Factory middleware — allows only users whose role is in the provided list.
 * Must be used AFTER authMiddleware (requires req.user).
 *
 * Usage:
 *   router.get('/admin-only', authMiddleware, authorizeRoles('admin'), handler)
 *   router.get('/staff-or-admin', authMiddleware, authorizeRoles('admin', 'staff'), handler)
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized — not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied — requires role: ${roles.join(' or ')}`
    });
  }
  next();
};

module.exports = authorizeRoles;
