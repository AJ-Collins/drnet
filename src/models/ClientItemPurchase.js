const db = require("../config/db");

const ClientItemPurchase = {
  create: async (data) => {
    const {
      first_name,
      last_name,
      item_id,
      quantity,
      total_amount,
      purchase_date,
      payment_status,
      notes,
    } = data;
    const [result] = await db.query(
      `INSERT INTO client_item_purchases (first_name, last_name, item_id, quantity, total_amount, purchase_date, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        item_id,
        quantity,
        total_amount,
        purchase_date,
        payment_status,
        notes,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM client_item_purchases`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM client_item_purchases WHERE id=?`,
      [id]
    );
    return result;
  },
};

module.exports = ClientItemPurchase;
