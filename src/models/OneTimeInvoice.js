const db = require("../config/db");

const OneTimeInvoice = {
  create: async (data) => {
    const {
      invoice_number,
      client_purchase_id,
      payment_id,
      subtotal,
      vat,
      grand_total,
      notes,
      due_date,
    } = data;
    const [result] = await db.query(
      `INSERT INTO one_time_invoices (invoice_number, client_purchase_id, payment_id, subtotal, vat, grand_total, notes, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        client_purchase_id,
        payment_id,
        subtotal,
        vat,
        grand_total,
        notes,
        due_date,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM one_time_invoices`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM one_time_invoices WHERE id=?`,
      [id]
    );
    return rows[0];
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM one_time_invoices WHERE id=?`,
      [id]
    );
    return result;
  },
};

module.exports = OneTimeInvoice;
