const db = require("../config/db");

const ClientItemPayment = {
  create: async (data) => {
    const {
      client_purchase_id,
      transaction_id,
      amount,
      payment_method,
      payment_date,
    } = data;
    const [result] = await db.query(
      `INSERT INTO client_item_payments (client_purchase_id, transaction_id, amount, payment_method, payment_date)
       VALUES (?, ?, ?, ?, ?)`,
      [client_purchase_id, transaction_id, amount, payment_method, payment_date]
    );
    return result;
  },

  findAllByPurchase: async (client_purchase_id) => {
    const [rows] = await db.query(
      `SELECT * FROM client_item_payments WHERE client_purchase_id=?`,
      [client_purchase_id]
    );
    return rows;
  },
};

module.exports = ClientItemPayment;
