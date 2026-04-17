const mongoose = require('mongoose');

/**
 * validateObjectId(paramName = 'id')
 * Middleware that checks a route param is a valid MongoDB ObjectId.
 * Prevents invalid-ID errors from reaching the DB and stops IDOR probing.
 */
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `Invalid ${paramName} format` });
  }
  next();
};

module.exports = validateObjectId;
