/**
 * counterSaleApi.js
 * Frontend API wrapper for Feature 3: Counter Sales
 * All endpoints mapped to backend routes added/updated in Step 1.
 */
import api from './axios';

const counterSaleApi = {

  // ── Trips ───────────────────────────────────────────────────────────────

  /**
   * GET /api/trips
   * Fetch trips for counter sale with date + station filters.
   * @param {object} params
   * @param {string} params.date        - YYYY-MM-DD (Vietnam local date)
   * @param {string} [params.fromStation] - Station ObjectId
   * @param {string} [params.toStation]   - Station ObjectId
   * @param {string} [params.status]      - 'scheduled' | 'ongoing'
   * @param {number} [params.limit]       - default 100
   */
  getTrips: (params = {}) =>
    api.get('/trips', {
      params: {
        limit: 100,
        ...params,
      }
    }),

  // ── Stations ────────────────────────────────────────────────────────────

  /**
   * GET /api/stations
   * For dropdowns in the counter sale trip search form.
   */
  getStations: () =>
    api.get('/stations', { params: { limit: 200 } }),

  // ── Trip Seats ──────────────────────────────────────────────────────────

  /**
   * GET /api/trip-seats/:tripId
   * Returns all seats for a trip with auto-release of expired locks.
   * Response includes: seat.seatNumber, status, lockedBy, lockedUntil
   */
  getSeats: (tripId) =>
    api.get(`/trip-seats/${tripId}`),

  /**
   * GET /api/trip-seats/:tripId/count
   * Returns { available, booked, locked, total }
   */
  getSeatCount: (tripId) =>
    api.get(`/trip-seats/${tripId}/count`),

  /**
   * POST /api/trip-seats/lock/:tripSeatId
   * Hold a seat for 15 minutes.
   * Returns updated TripSeat with lockedUntil & minutesRemaining.
   * Throws 409 if another user has an active lock.
   */
  lockSeat: (tripSeatId) =>
    api.post(`/trip-seats/lock/${tripSeatId}`),

  /**
   * DELETE /api/trip-seats/unlock/:tripSeatId
   * Release a held seat. Staff/admin can unlock any seat.
   */
  unlockSeat: (tripSeatId) =>
    api.delete(`/trip-seats/unlock/${tripSeatId}`),

  // ── Counter Booking ─────────────────────────────────────────────────────

  /**
   * POST /api/bookings/counter
   * Create a walk-in booking + auto-generate tickets.
   *
   * @param {object} body
   * @param {string}   body.tripId
   * @param {string[]} body.seatIds          - Array of TripSeat ObjectIds (max 5)
   * @param {string}   body.passengerName    - Required
   * @param {string}   body.passengerPhone   - Required, 9-11 digits
   * @param {string}   [body.passengerEmail]
   * @param {string}   [body.passengerIdCard] - CCCD/CMND
   * @param {string}   [body.paymentMethod]  - 'counter' | 'bank_transfer' | 'card'
   * @param {string}   [body.note]
   *
   * @returns {object} { booking, tickets, summary }
   */
  createCounterBooking: (body) =>
    api.post('/bookings/counter', body),

  // ── Tickets ─────────────────────────────────────────────────────────────

  /**
   * GET /api/tickets
   * Staff: all tickets for their company's trips.
   * Supports: ?source=counter&date=YYYY-MM-DD
   */
  getTickets: (params = {}) =>
    api.get('/tickets', { params }),

  /**
   * POST /api/tickets/verify
   * Check-in scan. Accepts { code } or { ticketId }.
   * Returns populated ticket on success.
   */
  verifyTicket: (payload) =>
    api.post('/tickets/verify', payload),

};

export default counterSaleApi;
