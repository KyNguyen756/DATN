const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

module.exports = async (req, res, next) => {

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Populate busCompany and managedStations for RBAC checks in downstream middleware
    const user = await User
      .findById(decoded.id)
      .populate("busCompany", "name shortName code logo status")
      .populate("managedStations", "name city");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status === "locked") {
      return res.status(403).json({ message: "Account is locked" });
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }

};
