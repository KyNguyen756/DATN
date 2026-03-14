const Booking = require("../models/bookingModel");
const TripSeat = require("../models/tripSeatModel");

exports.createBooking = async (req, res) => {

  try {

    const { tripId, seatIds } = req.body;

    const seats = await TripSeat.find({
      _id: { $in: seatIds }
    });

    for (let seat of seats) {

      if (seat.status !== "locked") {
        return res.status(400).json({
          message: "Seat not locked"
        });
      }

      if (seat.lockedBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Seat locked by another user"
        });
      }

    }

    const tripPrice = req.body.price;

    const booking = await Booking.create({

      user: req.user.id,
      trip: tripId,
      seats: seatIds,
      totalPrice: tripPrice * seatIds.length

    });

    await TripSeat.updateMany(
      { _id: { $in: seatIds } },
      { status: "booked" }
    );

    res.json(booking);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

exports.getMyBookings = async (req, res) => {

  const bookings = await Booking.find({
    user: req.user.id
  })
    .populate("trip")
    .populate("seats");

  res.json(bookings);

};

exports.getBookings = async (req, res) => {

  const bookings = await Booking.find()
    .populate("user")
    .populate("trip");

  res.json(bookings);

};

exports.cancelBooking = async (req, res) => {

  const booking = await Booking.findById(req.params.id);

  booking.bookingStatus = "cancelled";

  await booking.save();

  await TripSeat.updateMany(
    { _id: { $in: booking.seats } },
    { status: "available" }
  );

  res.json({
    message: "Booking cancelled"
  });

};
