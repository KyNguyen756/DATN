const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");

// GET ALL USERS
exports.getUsers = async (req, res) => {

  const users = await User.find();

  res.json(users);
};

//GET ME
exports.getMe = async (req, res) => {

  const user = await User.findById(req.user.id)
    .select("-password");

  res.json(user);
};

// GET USER BY ID
exports.getUserById = async (req, res) => {

  const user = await User.findById(req.params.id);

  res.json(user);
};

// UPDATE USER
exports.updateProfile = async (req, res) => {

  const {
    firstName,
    lastName,
    birthDate,
    phoneNumber
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      firstName,
      lastName,
      birthDate,
      phoneNumber
    },
    { new: true }
  ).select("-password");

  res.json(user);
};

//AVATAR CHANGE
exports.updateAvatar = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    // xóa avatar cũ trên cloudinary
    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    // avatar mới
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;

    await user.save();

    res.json(user);

  } catch (error) {
    res.status(500).json(error);
  }

};


// DELETE USER
exports.deleteUser = async (req, res) => {

  await User.findByIdAndDelete(req.params.id);

  res.json("User deleted");
};
