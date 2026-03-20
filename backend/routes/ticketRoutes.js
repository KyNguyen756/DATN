const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// User: view own tickets
router.get("/my", authMiddleware, ticketController.getMyTickets);

// User/Admin: verify a ticket (staff check-in)
router.post("/verify", authMiddleware, ticketController.verifyTicket);

// Admin: all tickets
router.get("/", authMiddleware, adminMiddleware, ticketController.getAllTickets);

// Create tickets for a booking (owner or admin)
router.post("/:bookingId", authMiddleware, ticketController.createTickets);

module.exports = router;