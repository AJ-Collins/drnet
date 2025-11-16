const db = require("../config/db");

const SupportTicketMessage = {
  // Create a message
  create: async (data) => {
    const { ticket_id, sender_user_id, sender_staff_id, message } = data;
    const [result] = await db.query(
      `INSERT INTO support_ticket_messages 
        (ticket_id, sender_user_id, sender_staff_id, message)
       VALUES (?, ?, ?, ?)`,
      [ticket_id, sender_user_id, sender_staff_id, message]
    );
    return result;
  },

  // Get message by ID
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM support_ticket_messages WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get all messages for a ticket
  findAllByTicket: async (ticket_id) => {
    const [rows] = await db.query(
      `SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
      [ticket_id]
    );
    return rows;
  },

  // Get all messages by user
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      `SELECT m.*, t.user_id 
       FROM support_ticket_messages m
       JOIN support_tickets t ON m.ticket_id = t.id
       WHERE t.user_id = ?
       ORDER BY m.created_at ASC`,
      [userId]
    );
    return rows;
  },

  // Delete all messages of a ticket
  deleteByTicket: async (ticket_id) => {
    await db.query(`DELETE FROM support_ticket_messages WHERE ticket_id = ?`, [
      ticket_id,
    ]);
    return true;
  },

  // Delete a single message
  deleteById: async (id) => {
    await db.query(`DELETE FROM support_ticket_messages WHERE id = ?`, [id]);
    return true;
  },

  findAll: async () => {
    const [rows] = await db.query(
      `SELECT * FROM support_ticket_messages ORDER BY created_at ASC`
    );
    return rows;
  }
};

module.exports = SupportTicketMessage;
