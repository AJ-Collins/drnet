const db = require("../config/db");

const HrExpense = {
  create: async (data) => {
    const sql = `INSERT INTO hrexpenses (amount, category, description, beneficiary, expense_date) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [data.amount, data.category, data.description, data.beneficiary, data.expense_date]);
    return { id: result.insertId, ...data };
  },

  findAll: async () => {
    const [rows] = await db.query("SELECT * FROM hrexpenses ORDER BY expense_date DESC, created_at DESC");
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
        `SELECT * FROM hrexpenses WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
    },

  update: async (id, data) => {
    const sql = `
      UPDATE hrexpenses 
      SET amount = ?, category = ?, description = ?, beneficiary = ?, expense_date = ? 
      WHERE id = ?
    `;
    await db.query(sql, [data.amount, data.category, data.description, data.beneficiary, data.expense_date, id]);
    const [rows] = await db.query("SELECT * FROM hrexpenses WHERE id = ?", [id]);
    return rows[0];
  },

  delete: async (id) => {
    await db.query("DELETE FROM hrexpenses WHERE id = ?", [id]);
    return true;
  }
};

module.exports = HrExpense;