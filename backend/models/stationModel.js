const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  address: {
    type: String
  },

  type: {
    type: String,
    enum: ["station", "pickup", "dropoff"],
    default: "station"
  },

  latitude: Number,

  longitude: Number,

  // Many-to-many back-reference to BusCompany
  busCompanies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusCompany"
    }
  ],

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("Station", stationSchema);
