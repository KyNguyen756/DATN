const express = require("express");
const router  = express.Router();
const ticketController = require("../controllers/ticketController");
const authMiddleware   = require("../middleware/authMiddleware");
const adminMiddleware  = require("../middleware/adminMiddleware");
const staffMiddleware  = require("../middleware/staffMiddleware");

// Authenticated user: view own tickets
router.get("/my", authMiddleware, ticketController.getMyTickets);

// Staff/Admin: verify a ticket (check-in)
router.post("/verify", authMiddleware, staffMiddleware, ticketController.verifyTicket);

// Staff/Admin: all tickets (staff scoped to their company)
router.get("/", authMiddleware, staffMiddleware, ticketController.getAllTickets);

// Owner / Staff / Admin: create tickets for a booking
router.post("/:bookingId", authMiddleware, ticketController.createTickets);

module.exports = router;