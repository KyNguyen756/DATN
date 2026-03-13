const Trip = require("../models/tripModel");
const Bus = require("../models/busModel");
const Seat = require("../models/seatModel");
const TripSeat = require("../models/tripseatModel");
const Route = require("../models/routeModel");

const toResponse = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const busId = obj.bus?._id || obj.bus;
  const routeId = obj.route?._id || obj.route;
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    busId: busId?.toString?.(),
    routeId: routeId?.toString?.(),
    date: obj.departureTime ? new Date(obj.departureTime).toISOString().slice(0, 10) : null,
  };
};

exports.createTrip = async (req, res) => {
  try {
    const { bus, busId, routeId, date, departureTime, price } = req.body;
    const busRef = bus || busId;
    const busData = await Bus.findById(busRef);
    if (!busData) {
      return res.status(404).json({ message: "Bus not found" });
    }

    let departureLocation = req.body.departureLocation;
    let arrivalLocation = req.body.arrivalLocation;
    let routeRef = routeId;

    if (routeId) {
      const route = await Route.findById(routeId);
      if (route) {
        departureLocation = route.startLocation;
        arrivalLocation = route.endLocation;
      }
    }

    const depDate = date ? new Date(date) : new Date();
    const [h, m] = (departureTime || "08:00").toString().split(":").map(Number);
    depDate.setHours(h || 8, m || 0, 0, 0);
    const arrDate = new Date(depDate);
    arrDate.setHours(arrDate.getHours() + 2);

    const tripData = {
      bus: busRef,
      route: routeRef,
      departureLocation: departureLocation || "Điểm đi",
      arrivalLocation: arrivalLocation || "Điểm đến",
      departureTime: depDate,
      arrivalTime: arrDate,
      price: Number(price) || 0,
      availableSeats: busData.totalSeats,
    };

    const trip = await Trip.create(tripData);
    const seats = await Seat.find({ bus: busRef });
    const tripSeats = seats.map((seat) => ({
      trip: trip._id,
      seat: seat._id,
      status: "available",
    }));
    await TripSeat.insertMany(tripSeats);

    const populated = await Trip.findById(trip._id).populate("bus").populate("route");
    res.status(201).json(toResponse(populated));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.getTrips = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = {};

    if (from) filter.departureLocation = new RegExp(from, "i");
    if (to) filter.arrivalLocation = new RegExp(to, "i");
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: start, $lte: end };
    }

    const trips = await Trip.find(filter)
      .populate("bus")
      .populate("route");
    res.json(trips.map(toResponse));
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("bus")
      .populate("route");
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(toResponse(trip));
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.busId) body.bus = body.busId;
    if (body.routeId) body.route = body.routeId;
    if (body.date && body.departureTime) {
      const d = new Date(body.date);
      const [h, m] = body.departureTime.toString().split(":").map(Number);
      d.setHours(h || 8, m || 0, 0, 0);
      body.departureTime = d;
      body.arrivalTime = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    }
    const trip = await Trip.findByIdAndUpdate(req.params.id, body, { new: true })
      .populate("bus")
      .populate("route");
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(toResponse(trip));
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};
