/**
 * tripStatusCron.js
 *
 * Runs every 5 minutes to update Trip.status based on departureTime / arrivalTime.
 *
 * Status logic:
 *   scheduled → more than 60 min before departure
 *   active    → 0–60 min before departure
 *   ongoing   → departure passed, arrival not yet passed
 *   completed → arrival passed
 *   cancelled → manual override (never touched by this cron)
 *
 * Performance: uses targeted updateMany filters on each status — avoids touching
 * documents that are already in the correct state (MongoDB will not write noop updates).
 */
const cron = require("node-cron");
const Trip = require("../models/tripModel");

/**
 * Compute the correct status for a trip at a given moment.
 * Used as a lightweight fallback in controllers (no DB write needed).
 */
function computeDynamicStatus(trip, now = new Date()) {
  if (trip.status === "cancelled") return "cancelled";

  const dep = new Date(trip.departureTime);
  const arr = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
  const ACTIVE_WINDOW_MS = 60 * 60 * 1000; // 60 min before departure

  if (now >= dep) {
    if (arr && now >= arr) return "completed";
    return "ongoing";
  }
  if (dep - now <= ACTIVE_WINDOW_MS) return "active";
  return "scheduled";
}

async function runStatusUpdate() {
  const now = new Date();
  const minus60min = new Date(now.getTime() - 60 * 60 * 1000); // 60 min ago
  const plus60min  = new Date(now.getTime() + 60 * 60 * 1000); // 60 min ahead

  try {
    const [r1, r2, r3, r4] = await Promise.all([
      // scheduled → active: departure is within 60 min
      Trip.updateMany(
        {
          status: "scheduled",
          departureTime: { $lte: plus60min, $gt: now }
        },
        { $set: { status: "active" } }
      ),

      // active/scheduled → ongoing: departure has passed, arrival hasn't
      Trip.updateMany(
        {
          status: { $in: ["active", "scheduled"] },
          departureTime: { $lte: now },
          $or: [
            { arrivalTime: { $gt: now } },
            { arrivalTime: { $exists: false } },
            { arrivalTime: null }
          ]
        },
        { $set: { status: "ongoing" } }
      ),

      // ongoing/active → completed: arrival has passed
      Trip.updateMany(
        {
          status: { $in: ["ongoing", "active", "scheduled"] },
          arrivalTime: { $lte: now }
        },
        { $set: { status: "completed" } }
      ),

      // Edge case: active trips where departure is still >60 min away
      // (e.g., someone manually set to active) → revert to scheduled
      Trip.updateMany(
        {
          status: "active",
          departureTime: { $gt: plus60min }
        },
        { $set: { status: "scheduled" } }
      )
    ]);

    const total = r1.modifiedCount + r2.modifiedCount + r3.modifiedCount + r4.modifiedCount;
    if (total > 0) {
      console.log(`[TripStatusCron] ${new Date().toISOString()} — updated ${total} trip(s)`);
    }
  } catch (err) {
    console.error("[TripStatusCron] Error:", err.message);
  }
}

function startTripStatusCron() {
  // Run immediately on startup, then every 5 minutes
  runStatusUpdate();
  cron.schedule("*/5 * * * *", runStatusUpdate);
  console.log("[TripStatusCron] Started — runs every 5 minutes");
}

module.exports = { startTripStatusCron, computeDynamicStatus };
