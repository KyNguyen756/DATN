const Booking = require("../models/bookingModel");
const Ticket = require("../models/ticketModel");
const User = require("../models/userModel");
const Trip = require("../models/tripModel");
const asyncHandler = require("../utils/asyncHandler");

// Vietnam timezone offset in ms (UTC+7)
const VN_TZ_OFFSET = 7 * 60 * 60 * 1000;

/** Convert a UTC date to Vietnam local YYYY-MM-DD string for grouping */
function vnDateString(utcDate) {
  const vnMs = utcDate.getTime() + VN_TZ_OFFSET;
  return new Date(vnMs).toISOString().slice(0, 10);
}

// GET /api/stats/summary  (public)
exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalTickets, totalTrips, totalUsers] = await Promise.all([
    Ticket.countDocuments({ status: { $ne: "cancelled" } }),
    Trip.countDocuments({ status: { $in: ["scheduled", "active", "ongoing"] } }),
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
    revenueAgg,
    totalUsers,
    totalTickets,
    rawBookingsPerDay,
    recentBookings
  ] = await Promise.all([
    Booking.countDocuments({ bookingStatus: "active" }),

    // Use finalPrice (after discount) for accurate revenue
    Booking.aggregate([
      { $match: { bookingStatus: "active" } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]),

    // Count only actual customers (not staff/admin)
    User.countDocuments({ role: "user" }),

    Ticket.countDocuments({ status: { $ne: "cancelled" } }),

    // Bookings per day with Vietnam-local date grouping
    Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, bookingStatus: "active" } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "+07:00"        // Vietnam timezone
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$finalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Recent 10 active bookings with full populate
    Booking.find({ bookingStatus: "active" })
      .populate("user", "-password")
      .populate({
        path: "trip",
        populate: [
          { path: "fromStation", select: "name city" },
          { path: "toStation", select: "name city" }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.json({
    totalBookings,
    totalRevenue: revenueAgg[0]?.total || 0,
    totalUsers,
    totalTickets,
    bookingsPerDay: rawBookingsPerDay,
    recentBookings
  });
});
