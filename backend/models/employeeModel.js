const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "staff"],
      default: "staff",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
