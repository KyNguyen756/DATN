const Booking = require("../models/bookingModel");
const TripSeat = require("../models/tripseatModel");
const Trip = require("../models/tripModel");

exports.createBooking = async (req, res) => {
  try {

    const { tripId, seatIds } = req.body;

    // lấy ghế
    const seats = await TripSeat.find({
      _id: { $in: seatIds }
    });

    // kiểm tra ghế có được giữ bởi user không
    for (let seat of seats) {

      if (seat.status !== "reserved") {
        return res.status(400).json({
          message: "Seat not reserved"
        });
      }

      if (seat.reservedBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Seat not reserved by you"
        });
      }

    }

    // tính giá
    const trip = await Trip.findById(tripId);
    const totalPrice = trip.price * seats.length;

    // tạo booking
    const booking = await Booking.create({
      user: req.user.id,
      trip: tripId,
      seats: seatIds,
      totalPrice,
      status: "pending"
    });

    // đổi trạng thái ghế
    await TripSeat.updateMany(
      { _id: { $in: seatIds } },
      {
        status: "booked",
        reservedBy: null,
        reservedUntil: null
      }
    );

    // giảm ghế trống
    await Trip.findByIdAndUpdate(tripId, {
      $inc: { availableSeats: -seats.length }
    });

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getMyBookings = async (req, res) => {
  try {

    const bookings = await Booking.find({
      user: req.user.id
    })
    .populate("trip")
    .populate({
      path: "seats",
      populate: { path: "seat" }
    });

    res.json(bookings);

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getBookingById = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id)
      .populate("user", "firstname lastname username")
      .populate("trip")
      .populate({
        path: "seats",
        populate: {
          path: "seat"
        }
      });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    res.json(booking);

  } catch (error) {
    res.status(500).json(error);
  }
};


exports.confirmBooking = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    await booking.save();

    await TripSeat.updateMany(
      { _id: { $in: booking.seats } },
      {
        status: "booked",
        reservedBy: null,
        reservedUntil: null
      }
    );

    await Trip.findByIdAndUpdate(
      booking.trip,
      {
        $inc: { availableSeats: -booking.seats.length }
      }
    );

    res.json({
      message: "Booking confirmed",
      booking
    });

  } catch (error) {
    res.status(500).json(error);
  }
};

exports.cancelBooking = async (req, res) => {
  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    booking.status = "cancelled";

    await booking.save();

    await TripSeat.updateMany(
      { _id: { $in: booking.seats } },
      {
        status: "available"
      }
    );

    res.json({
      message: "Booking cancelled"
    });

  } catch (error) {
    res.status(500).json(error);
  }
};
