require("dotenv").config();
const { runProjectAlerts } = require("../cron/projectAlerts");
const db = require("../config/db");

runProjectAlerts()
  .then(async () => {
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
