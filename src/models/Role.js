const db = require("../config/db");

const Role = {
  create: async (data) => {
    const { id, name } = data;
    const [result] = await db.query(
      `INSERT INTO roles (id, name) VALUES (?, ?)`,
      [id, name]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM roles`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM roles WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Role;
