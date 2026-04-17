const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const validateObjectId = require("../middleware/validateObjectId");

// User: view own tickets
router.get("/my", authMiddleware, ticketController.getMyTickets);

// User/Staff: verify a ticket (staff check-in)
router.post("/verify", authMiddleware, ticketController.verifyTicket);

// User (owner) or Staff/Admin: cancel a single ticket
router.patch("/:id/cancel", authMiddleware, validateObjectId(), ticketController.cancelTicket);

// Admin: all tickets
router.get("/", authMiddleware, authorizeRoles("admin"), ticketController.getAllTickets);

// Create tickets for a booking (owner or admin) — legacy
router.post("/:bookingId", authMiddleware, ticketController.createTickets);

module.exports = router;