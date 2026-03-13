const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default: ""
    },

    avatarPublicId: {
      type: String
    },

    firstName: {
      type: String,
      required: true
    },

    lastName: {
      type: String,
      required: true
    },

    username: {
      type: String,
      unique: true,
      required: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      required: true
    },

    birthDate: {
      type: Date
    },

    cccd: {
      type: String,
      unique: true
    },

    phoneNumber: {
      type: String
    },

    role: {
      type: String,
      enum: ["passenger", "admin"],
      default: "passenger"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
