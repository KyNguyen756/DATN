const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  firstName: String,

  lastName: String,

  phone: {
    type: String,
    unique: true,
    sparse: true
  },

  avatar: String,

  dateOfBirth: Date,

  address: String

}, { timestamps: true });

module.exports = mongoose.model("UserProfile", userProfileSchema);
