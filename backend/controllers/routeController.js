const Route = require("../models/routeModel");

const toResponse = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: (obj._id || obj.id)?.toString() };
};

exports.getAll = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes.map(toResponse));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.getById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(toResponse(route));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.create = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(toResponse(route));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.update = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(toResponse(route));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.delete = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};
