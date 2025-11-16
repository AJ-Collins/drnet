const db = require("../config/db");

const OneTimeInvoiceItem = {
  create: async (data) => {
    const { invoice_id, description, quantity, unit_price, total } = data;
    const [result] = await db.query(
      `INSERT INTO one_time_invoice_items (invoice_id, description, quantity, unit_price, total)
       VALUES (?, ?, ?, ?, ?)`,
      [invoice_id, description, quantity, unit_price, total]
    );
    return result;
  },

  findAllByInvoice: async (invoice_id) => {
    const [rows] = await db.query(
      `SELECT * FROM one_time_invoice_items WHERE invoice_id=?`,
      [invoice_id]
    );
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM one_time_invoice_items WHERE id=?`,
      [id]
    );
    return result;
  },
};

module.exports = OneTimeInvoiceItem;
