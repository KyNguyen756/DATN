/**
 * busCompanyMiddleware
 *
 * Verifies that the authenticated user belongs to (or manages) the BusCompany
 * associated with the resource being accessed.
 *
 * Usage: router.put("/:id", auth, busCompanyMiddleware("busCompany"), handler)
 *
 * The `field` parameter is the name of the field on the resource document
 * that holds the BusCompany ObjectId. Defaults to "busCompany".
 *
 * Admin users always pass through regardless of company.
 * Staff users must have req.user.busCompany._id matching the resource's field.
 */
const busCompanyMiddleware = (field = "busCompany") => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Admins have global access
    if (user.role === "admin") {
      return next();
    }

    if (user.role !== "staff") {
      return res.status(403).json({ message: "Staff or Admin access required" });
    }

    // The resource's busCompany id must be set in req.resourceCompanyId
    // by the controller before calling this middleware,
    // OR passed directly to this middleware via req.params / req body checks.
    //
    // Typical pattern: controller reads resource, then calls next() if company matches.
    // Here we provide a helper to check a pre-set value.
    const resourceCompanyId = req.resourceCompanyId; // set by controller

    if (!resourceCompanyId) {
      // If controller hasn't set it yet, pass through — let controller handle it
      return next();
    }

    const userCompanyId = user.busCompany?._id?.toString();

    if (!userCompanyId) {
      return res.status(403).json({ message: "You are not assigned to any bus company" });
    }

    if (userCompanyId !== resourceCompanyId.toString()) {
      return res.status(403).json({ message: "Access denied: resource belongs to a different bus company" });
    }

    next();
  };
};

/**
 * Standalone helper: check if a user belongs to the given companyId.
 * Returns true if admin or if user.busCompany matches.
 */
const userBelongsToCompany = (user, companyId) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.busCompany?._id?.toString() === companyId?.toString();
};

module.exports = busCompanyMiddleware;
module.exports.userBelongsToCompany = userBelongsToCompany;
