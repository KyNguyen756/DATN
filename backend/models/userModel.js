const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "staff", "admin"],
    default: "user"
  },

  // RBAC: assigned bus company (for staff/admin)
  busCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusCompany",
    default: null
  },

  // Stations this user manages (subset of busCompany.stations)
  managedStations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station"
    }
  ],

  status: {
    type: String,
    enum: ["active", "locked"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
