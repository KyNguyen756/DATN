const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      username,
      password,
      birthDate,
      cccd,
      phoneNumber
    } = req.body;

    const exist = await User.findOne({ username });

    if (exist) {
      return res.status(400).json("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatar;

    if (req.file) {
      avatar = req.file.path;
    } else {
      const fullName = `${firstName} ${lastName}`;
      avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    }

    const user = await User.create({
      avatar,
      firstName,
      lastName,
      username,
      password: hashedPassword,
      birthDate,
      cccd,
      phoneNumber
    });

    res.json(user);

  } catch (error) {
    res.status(500).json(error);
  }
};

// LOGIN
exports.login = async (req, res) => {

  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json("User not found");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json("Wrong password");
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user
  });
};

//CHANGE PASS
exports.changePassword = async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  const valid = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!valid) {
    return res.status(400).json("Wrong password");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;

  await user.save();

  res.json("Password updated");
};
