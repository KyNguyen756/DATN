const express = require("express");

const router = express.Router();

const ticketController = require("../controllers/ticketController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post(
  "/generate/:bookingId",
  authMiddleware,
  ticketController.createTickets
);

router.get(
  "/my-tickets",
  authMiddleware,
  ticketController.getMyTickets
);

router.post(
  "/verify",
  authMiddleware,
  adminMiddleware,
  ticketController.verifyTicket
);

module.exports = router;