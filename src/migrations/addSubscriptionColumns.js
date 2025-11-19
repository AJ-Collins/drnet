const db = require("../config/db");

async function addSubscriptionColumns() {
  try {
    await db.query(`
      ALTER TABLE payments
      ADD COLUMN status VARCHAR(50) DEFAULT 'unpaid' AFTER amount
    `);

    console.log("Status added");
  } catch (err) {
    console.error("Error adding status columns:", err);
  }
}

module.exports = addSubscriptionColumns;
