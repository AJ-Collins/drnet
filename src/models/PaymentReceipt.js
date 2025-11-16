const db = require("../config/db");

const PaymentReceipt = {
  create: async (data) => {
    const {
      user_id,
      payment_id,
      receipt_number,
      amount,
      payment_method,
      status,
      receipt_date,
    } = data;
    const [result] = await db.query(
      `INSERT INTO payment_receipts (user_id, payment_id, receipt_number, amount, payment_method, status, receipt_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        payment_id,
        receipt_number,
        amount,
        payment_method,
        status,
        receipt_date,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM payment_receipts`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM payment_receipts WHERE id=?`, [
      id,
    ]);
    return rows[0];
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM payment_receipts WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = PaymentReceipt;
