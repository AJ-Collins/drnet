// Run manually once via: node src/scripts/backfillMonthlyAnalytics.js
// Safe to re-run — only fills months that don't already have a row.

const MonthlyAnalytics = require("../models/MonthlyAnalytics");

(async () => {
    try {
        console.log("Backfilling monthly_analytics from production data...");
        const result = await MonthlyAnalytics.backfillAll();
        console.log(`Done. ${result.created} month(s) processed:`);
        console.log(result.months.join(", "));
        process.exit(0);
    } catch (err) {
        console.error("Backfill failed:", err);
        process.exit(1);
    }
})();
