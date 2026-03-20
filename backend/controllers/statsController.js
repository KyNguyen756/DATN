const Booking = require("../models/bookingModel");
const Ticket = require("../models/ticketModel");
const User = require("../models/userModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/stats/summary  (public)
exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalTickets, totalTrips, totalUsers] = await Promise.all([
    Ticket.countDocuments({ status: { $ne: "cancelled" } }),
    Trip.countDocuments({ status: "active" }),
    User.countDocuments({ role: "user" }),
  ]);

  res.json({ totalTickets, totalTrips, totalUsers });
});

// GET /api/stats/admin  (admin only)
exports.getAdminStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalBookings,
    totalRevenue,
    totalUsers,
    totalTickets,
    bookingsPerDay,
    recentBookings
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { bookingStatus: "active" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]),
    User.countDocuments(),
    Ticket.countDocuments({ status: { $ne: "cancelled" } }),
    // Bookings per day for the last 30 days
    Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    // Recent 10 bookings
    Booking.find()
      .populate("user", "-password")
      .populate("trip")
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.json({
    totalBookings,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalUsers,
    totalTickets,
    bookingsPerDay,
    recentBookings
  });
});
