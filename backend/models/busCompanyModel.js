const mongoose = require("mongoose");

const busCompanySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  shortName: {
    type: String,
    trim: true,
    default: ""
  },

  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, digits, or underscores"]
  },

  logo: {
    type: String,
    default: ""
  },

  hotline: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  // Many-to-many: BusCompany ↔ Station
  stations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station"
    }
  ],

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("BusCompany", busCompanySchema);
