const db = require("../config/db");

const Invoice = {
  create: async (data) => {
    const {
      invoice_number,
      user_id,
      package_id,
      payment_id,
      subtotal,
      vat,
      grand_total,
      notes,
      due_date,
    } = data;
    const [result] = await db.query(
      `INSERT INTO invoices (invoice_number, user_id, package_id, payment_id, subtotal, vat, grand_total, notes, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        user_id,
        package_id,
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
    const [rows] = await db.query(`SELECT * FROM invoices`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM invoices WHERE id=?`, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((key) => `${key}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);
    const [result] = await db.query(
      `UPDATE invoices SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM invoices WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Invoice;
