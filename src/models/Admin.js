const db = require("../config/db");

const Admin = {
  create: async (data) => {
    const {
      first_name,
      second_name,
      password,
      title,
      role_id,
      email,
      phone,
      address,
      image,
    } = data;
    const [result] = await db.query(
      `INSERT INTO admins (first_name, second_name, password, title, role_id, email, phone, address, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        second_name,
        password,
        title,
        role_id,
        email,
        phone,
        address,
        image,
      ]
    );
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM admins WHERE id = ?`, [id]);
    return rows[0];
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM admins`);
    return rows;
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((key) => `${key}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);
    const [result] = await db.query(
      `UPDATE admins SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM admins WHERE id=?`, [id]);
    return result;
  },
};

module.exports = Admin;
