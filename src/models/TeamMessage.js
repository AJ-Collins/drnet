const db = require("../config/db");

const TeamMessage = {
  create: async (data) => {
    const { sender_id, sender_type, message } = data;
    const [result] = await db.query(
      `INSERT INTO team_messages (sender_id, sender_type, message)
       VALUES (?, ?, ?)`,
      [sender_id, sender_type, message]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM team_messages`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM team_messages WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = TeamMessage;
