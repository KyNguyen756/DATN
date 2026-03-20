const Booking = require("../models/bookingModel");
const TripSeat = require("../models/tripseatModel");
const Ticket = require("../models/ticketModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { tripId, seatIds, passengerName, passengerPhone, passengerEmail, paymentMethod, note } = req.body;

  if (!tripId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "tripId and seatIds are required" });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const seats = await TripSeat.find({ _id: { $in: seatIds } });

  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "One or more seats not found" });
  }

  // Validate each seat is locked by the requesting user
  for (let seat of seats) {
    if (seat.status !== "locked") {
      return res.status(400).json({ message: `Seat ${seat._id} is not locked` });
    }
    if (seat.lockedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: `Seat ${seat._id} is locked by another user` });
    }
  }

  const booking = await Booking.create({
    user: req.user.id,
    trip: tripId,
    seats: seatIds,
    totalPrice: trip.price * seatIds.length,
    paymentStatus: "pending",
    bookingStatus: "active",
    passengerName: passengerName || "",
    passengerPhone: passengerPhone || "",
    passengerEmail: passengerEmail || "",
    paymentMethod: paymentMethod || "cod",
    note: note || ""
  });

  // Mark seats as booked
  await TripSeat.updateMany(
    { _id: { $in: seatIds } },
    { status: "booked", lockedBy: null, lockedUntil: null }
  );

  res.status(201).json(booking);
});

// GET /api/bookings/my-bookings
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate({
      path: "trip",
      populate: [
        { path: "fromStation" },
        { path: "toStation" },
        { path: "bus" }
      ]
    })
    .populate({ path: "seats", populate: { path: "seat" } })
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// GET /api/bookings  (admin)
exports.getBookings = asyncHandler(async (req, res) => {
  const { date, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.bookingStatus = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  const bookings = await Booking.find(filter)
    .populate("user", "-password")
    .populate("trip")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Booking.countDocuments(filter);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
});

// DELETE /api/bookings/:id
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Only the owner or an admin can cancel
  if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Cannot cancel another user's booking" });
  }

  if (booking.bookingStatus === "cancelled") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  booking.bookingStatus = "cancelled";
  await booking.save();

  // Release seats back to available
  await TripSeat.updateMany(
    { _id: { $in: booking.seats } },
    { status: "available", lockedBy: null, lockedUntil: null }
  );

  // Cancel linked tickets
  await Ticket.updateMany(
    { booking: booking._id },
    { status: "cancelled" }
  );

  res.json({ message: "Booking cancelled" });
});
