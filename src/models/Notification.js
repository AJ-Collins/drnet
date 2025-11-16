const db = require("../config/db");

const Notification = {
  create: async (data) => {
    const { type, reference_id, title, message, role_id, is_read } = data;
    const [result] = await db.query(
      `INSERT INTO notifications (type, reference_id, title, message, role_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, reference_id, title, message, role_id, is_read]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM notifications`);
    return rows;
  },

  markAsRead: async (id) => {
    const [result] = await db.query(
      `UPDATE notifications SET is_read=TRUE WHERE id=?`,
      [id]
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM notifications WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = Notification;
