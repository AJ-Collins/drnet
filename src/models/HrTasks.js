const db = require("../config/db");

const HrTask = {
  create: async (data) => {
    const sql = `INSERT INTO hrtasks (description, category, duration, task_date) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(sql, [data.description, data.category, data.duration, data.task_date]);
    return { id: result.insertId, ...data };
  },

  findAll: async () => {
    const sql = `
      SELECT 
        id, 
        description, 
        category, 
        duration, 
        task_date 
      FROM hrtasks 
      ORDER BY task_date DESC, created_at DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
      UPDATE hrtasks 
      SET description = ?, category = ?, duration = ?, task_date = ? 
      WHERE id = ?
    `;
    await db.query(sql, [data.description, data.category, data.duration, data.task_date, id]);
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM hrtasks WHERE id = ?", [id]);
    return true;
  }
};

module.exports = HrTask;