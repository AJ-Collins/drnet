const db = require("../config/db");

const Permission = {
  create: async (data) => {
    const { id, name, description } = data;
    const [result] = await db.query(
      `INSERT INTO permissions (id, name, description) VALUES (?, ?, ?)`,
      [id, name, description]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM permissions`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM permissions WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Permission;
