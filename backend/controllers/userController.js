const User = require("../models/userModel");
const UserProfile = require("../models/userProfileModel");

exports.getProfile = async (req, res) => {

  const profile = await UserProfile
    .findOne({ user: req.user.id })
    .populate("user", "-password");

  res.json(profile);

};

exports.updateProfile = async (req, res) => {

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true }
  );

  res.json(profile);

};

exports.uploadAvatar = async (req, res) => {

  const avatarUrl = req.file.path;

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user.id },
    { avatar: avatarUrl },
    { new: true }
  );

  res.json(profile);

};

exports.getAllUsers = async (req, res) => {

  const users = await User.find().select("-password");

  res.json(users);

};

exports.deleteUser = async (req, res) => {

  await User.findByIdAndDelete(req.params.id);

  res.json({
    message: "User deleted"
  });

};
