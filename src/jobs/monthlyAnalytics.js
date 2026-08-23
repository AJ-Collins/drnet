require("dotenv").config();
const { syncMonthlyAnalytics } = require("../cron/monthlyAnalyticsSync");
const db = require("../config/db");

syncMonthlyAnalytics()
  .then(async () => {
    // Explicitly close DB pool so script exits cleanly
    if (db && db.end) {
        await db.end();
    }
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    if (db && db.end) {
        await db.end();
    }
    process.exit(1);
  });
