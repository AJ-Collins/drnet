const db = require('../config/db');

async function createRenewal(data) {
  const {
    userId, userName, amount, renewalDate, expiryDate,
    month, year, isDeleted = false
  } = data;

  await db.execute(
    `INSERT INTO renewals (user_id, user_name, amount, renewal_date, expiry_date, month, year, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, userName, amount, renewalDate, expiryDate, month, year, isDeleted]
  );
}

async function getAllRenewals() {
  const [rows] = await db.execute("SELECT * FROM renewals ORDER BY renewal_date DESC");
  return rows;
}

module.exports = { createRenewal, getAllRenewals };
