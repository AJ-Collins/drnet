const db = require("../config/db");

const Package = {
  create: async (data) => {
    const { name, description, price, speed, classification, validity_days } =
      data;
    const [result] = await db.query(
      `INSERT INTO packages (name, description, price, speed, classification, validity_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, speed, classification, validity_days]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM packages`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM packages WHERE id = ?`, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const { name, description, price, speed, classification, validity_days } =
      data;

    const [result] = await db.query(
      `UPDATE packages 
     SET name=?, description=?, price=?, speed=?, classification=?, validity_days=? 
     WHERE id=?`,
      [name, description, price, speed, classification, validity_days, id]
    );

    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM packages WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Package;
