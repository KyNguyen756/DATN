const Employee = require("../models/employeeModel");
const bcrypt = require("bcryptjs");

const toResponse = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { password, ...rest } = obj;
  return { ...rest, id: (obj._id || obj.id)?.toString() };
};

exports.getAll = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");
    res.json(employees.map(toResponse));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.getById = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id).select("-password");
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(toResponse(emp));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.create = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password || "123456", 10);
    const emp = await Employee.create({ ...rest, password: hashed });
    res.status(201).json(toResponse(emp));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.update = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const update = { ...rest };
    if (password) update.password = await bcrypt.hash(password, 10);
    const emp = await Employee.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("-password");
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(toResponse(emp));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.delete = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};
