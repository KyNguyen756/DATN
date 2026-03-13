const Booking = require("../models/bookingModel");
const Trip = require("../models/tripModel");
const User = require("../models/userModel");

exports.getStats = async (req, res) => {
  try {
    const [totalTickets, totalTrips, totalPassengers, revenueResult] = await Promise.all([
      Booking.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Trip.countDocuments({ status: { $ne: "cancelled" } }),
      User.countDocuments({ role: "passenger" }),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalTickets,
      totalTrips,
      totalRevenue,
      totalPassengers,
    });
  } catch (error) {
    res.status(500).json(error?.message || error);
  }
};
