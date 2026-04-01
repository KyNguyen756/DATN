const User = require("../models/userModel");
const UserProfile = require("../models/userProfileModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");

exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ username, email, password: hashedPassword });

  await UserProfile.create({ user: user._id });

  // Never return password to client
  const userObj = user.toObject();
  delete userObj.password;

  res.status(201).json({ message: "Register success", user: userObj });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email })
    .populate('busCompany', 'name shortName code logo status')
    .populate('managedStations', 'name city');

  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ message: 'Account locked' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: 'Wrong password' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login success',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      busCompany: user.busCompany || null,
      managedStations: user.managedStations || [],
    }
  });
});
