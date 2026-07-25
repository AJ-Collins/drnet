const cron = require("node-cron");
const dayjs = require("dayjs");
const MonthlyAnalytics = require("../models/MonthlyAnalytics");

// Recomputes computed_* columns (never touches admin adjustments) for:
//   - the current month, every run — catches same-day activity
//   - the previous month, only for the first 5 days of a new month —
//     catches backdated entries (e.g. a sale logged late for last month)
async function syncMonthlyAnalytics() {
    const now = dayjs();
    const current = { year: now.year(), month: now.month() + 1 };

    try {
        await MonthlyAnalytics.recompute(current.year, current.month);
        console.log(`Monthly analytics synced: ${current.year}-${String(current.month).padStart(2, "0")}`);

        if (now.date() <= 5) {
            const prev = now.subtract(1, "month");
            await MonthlyAnalytics.recompute(prev.year(), prev.month() + 1);
            console.log(`Monthly analytics synced (prior month grace): ${prev.format("YYYY-MM")}`);
        }
    } catch (err) {
        console.error("Monthly analytics sync failed:", err);
    }
}

// Every 15 minutes
cron.schedule("*/15 * * * *", syncMonthlyAnalytics);

// Also run once at process startup so the current month isn't stale
// while waiting for the first scheduled tick after a deploy/restart.
syncMonthlyAnalytics();

module.exports = { syncMonthlyAnalytics };
