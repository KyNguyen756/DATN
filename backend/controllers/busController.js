const Bus = require("../models/busModel");

exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    res.json(bus);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(bus);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.deleteBus = async (req, res) => {

  try {

    await Bus.findByIdAndDelete(req.params.id);

    res.json("Bus deleted");

  } catch (error) {

    res.status(500).json(error);

  }

};
