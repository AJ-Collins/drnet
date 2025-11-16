const db = require("../config/db");

const Expense = {
  create: async (data) => {
    const { item_id, category, vendor, description, amount, expense_date } =
      data;
    const [result] = await db.query(
      `INSERT INTO expenses (item_id, category, vendor, description, amount, expense_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_id, category, vendor, description, amount, expense_date]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM expenses`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM expenses WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Expense;
