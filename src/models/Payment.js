const db = require("../config/db");

const Payment = {
  create: async (data) => {
    const {
      user_id,
      package_id,
      transaction_id,
      amount,
      payment_method,
      payment_date,
      notes,
    } = data;
    const [result] = await db.query(
      `INSERT INTO payments (user_id, package_id, transaction_id, amount, payment_method, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        package_id,
        transaction_id,
        amount,
        payment_method,
        payment_date,
        notes,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM payments`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM payments WHERE id=?`, [id]);
    return rows[0];
  },

  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT * FROM payments WHERE user_id=? ORDER BY payment_date DESC`,
      [userId]
    );
    return rows;
  },

  findByIdForUser: async (id, userId) => {
    const [rows] = await db.query(
      `SELECT * FROM payments WHERE id=? AND user_id=? LIMIT 1`,
      [id, userId]
    );
    return rows[0];
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM payments WHERE id=?`, [id]);
    return result;
  },
  //Helper function to get total payments in a month
  sumMonth: async (month) => {
    const [rows] = await db.query(
      `SELECT SUM(amount) AS total
     FROM payments
     WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = YEAR(CURDATE())`,
      [month]
    );
    return rows[0].total || 0;
  },

  // Sum payments by quarter (1 = Q1, 2 = Q2, ...)
  sumQuarter: async (quarter) => {
    let startMonth, endMonth;
    if (quarter === 1) [startMonth, endMonth] = [1, 3];
    else if (quarter === 2) [startMonth, endMonth] = [4, 6];
    else if (quarter === 3) [startMonth, endMonth] = [7, 9];
    else if (quarter === 4) [startMonth, endMonth] = [10, 12];
    else return 0;

    const [rows] = await db.query(
      `SELECT SUM(amount) AS total
     FROM payments
     WHERE MONTH(payment_date) BETWEEN ? AND ?
       AND YEAR(payment_date) = YEAR(CURDATE())`,
      [startMonth, endMonth]
    );
    return rows[0].total || 0;
  },
};

module.exports = Payment;
