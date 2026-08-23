require("dotenv").config();
const { sendReminders } = require("../cron/reminders");
const db = require("../config/db");

sendReminders()
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
