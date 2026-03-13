const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const seatRoutes = require("./routes/seatRoutes");
const tripRoutes = require("./routes/tripRoutes");
const tripseatRoutes = require("./routes/tripseatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const routeRoutes = require("./routes/routeRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/tripseats", tripseatRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/employees", employeeRoutes);

module.exports = app;
