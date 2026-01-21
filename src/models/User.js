const db = require("../config/db");

const User = {
  create: async (data) => {
    const {
      first_name,
      second_name,
      email,
      phone,
      id_number,
      address,
      password,
      image,
      is_active,
    } = data;
    const [result] = await db.query(
      `INSERT INTO users (first_name, second_name, email, phone, id_number, address, password, image, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        second_name,
        email,
        phone,
        id_number,
        address,
        password,
        image,
        is_active,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        u.*, 
        p.name AS subscription_plan,
        s.status AS subscription_status,
        s.expiry_date AS plan_expiry
      FROM users u
      LEFT JOIN user_subscriptions s ON u.id = s.user_id
      LEFT JOIN packages p ON s.package_id = p.id
    `);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT 
        id,
        first_name,
        second_name,
        email,
        phone,
        id_number,
        address,
        image,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
    `,
      [id]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM users WHERE id=?`, [id]);
    return result;
  },
};

module.exports = User;
