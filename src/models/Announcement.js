const db = require("../config/db");

const Announcement = {
  create: async (data) => {
    const { title, message, posted_by_id, posted_by_type, is_active } = data;
    const [result] = await db.query(
      `INSERT INTO announcements (title, message, posted_by_id, posted_by_type, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [title, message, posted_by_id, posted_by_type, is_active]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM announcements`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM announcements WHERE id=?`, [
      id,
    ]);
    return rows[0];
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((key) => `${key}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);
    const [result] = await db.query(
      `UPDATE announcements SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM announcements WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = Announcement;
