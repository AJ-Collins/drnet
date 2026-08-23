const dayjs = require("dayjs");
const MonthlyAnalytics = require("../models/MonthlyAnalytics");
const db = require("../config/db");

// Recomputes computed_* columns (never touches admin adjustments) for:
//   - the current month, every run — catches same-day activity
//   - the previous month, only for the first 5 days of a new month —
//     catches backdated entries (e.g. a sale logged late for last month)
async function syncMonthlyAnalytics() {
    let connection;
    try {
        // Acquire advisory lock to prevent concurrent executions from overlapping
        connection = await db.getConnection();
        const [lockResult] = await connection.query("SELECT GET_LOCK('drnet_monthly_analytics', 0) AS lock_acquired");

        if (!lockResult[0].lock_acquired) {
            console.log("Monthly analytics sync already running. Skipping this execution.");
            return;
        }

        const now = dayjs();
        const current = { year: now.year(), month: now.month() + 1 };

        await MonthlyAnalytics.recompute(current.year, current.month);
        console.log(`Monthly analytics synced: ${current.year}-${String(current.month).padStart(2, "0")}`);

        if (now.date() <= 5) {
            const prev = now.subtract(1, "month");
            await MonthlyAnalytics.recompute(prev.year(), prev.month() + 1);
            console.log(`Monthly analytics synced (prior month grace): ${prev.format("YYYY-MM")}`);
        }
    } catch (err) {
        console.error("Monthly analytics sync failed:", err);
        throw err; // throw so the CLI script knows it failed
    } finally {
        if (connection) {
            await connection.query("SELECT RELEASE_LOCK('drnet_monthly_analytics')");
            connection.release();
        }
    }
}

module.exports = { syncMonthlyAnalytics };
