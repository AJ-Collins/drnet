const db = require("../config/db");

const HrCommunication = {
  create: async (data) => {
    const sql = `INSERT INTO hrcommunicationlogs 
      (subject, recipient, method, body) 
      VALUES (?, ?, ?, ?)`;
    
    const [result] = await db.query(sql, [
      data.subject, data.recipient, data.method, data.body
    ]);
    return { id: result.insertId, ...data };
  },

  findRecent: async () => {
    const sql = `
      SELECT id, subject, recipient, method, sent_at 
      FROM hrcommunicationlogs 
      ORDER BY sent_at DESC 
      LIMIT 10
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  delete: async (id) => {
    await db.query("DELETE FROM hrcommunicationlogs WHERE id = ?", [id]);
    return true;
  }
};

module.exports = HrCommunication;