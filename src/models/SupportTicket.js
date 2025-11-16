const db = require("../config/db");

const SupportTicket = {
  // Map DB row to frontend-friendly format
  mapToFrontend: (row, usersMap = {}) => {
    const user = usersMap[row.user_id] || {};
    return {
      id: row.id,
      ticket_number: row.ticket_number || `TKT-${row.id}`,
      fullName: user.name || user.first_name || row.subject || "Unknown User",
      phone: user.phone || "N/A",
      issue_type: row.issue_type || "technical",
      priority: (row.priority || "medium").toLowerCase(),
      status: row.status || "open",
      subject: row.subject,
      description: row.description || "", // ← NEW
      created_at: row.created_at,
      assigned_to: row.assigned_to,
    };
  },

  // Create a new ticket
  create: async (data) => {
    const {
      ticket_number,
      user_id,
      subject,
      issue_type,
      priority,
      description,
      status,
      assigned_to,
    } = data;

    const [result] = await db.query(
      `INSERT INTO support_tickets 
      (ticket_number, user_id, subject, issue_type, priority, description, status, assigned_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_number,
        user_id,
        subject,
        issue_type,
        priority,
        description,
        status,
        assigned_to,
      ]
    );

    // No second query – just map the inserted data
    return {
      id: result.insertId,
      ticket_number,
      user_id,
      subject,
      issue_type,
      priority,
      description: description || "", // ← ALWAYS present
      status,
      assigned_to,
      created_at: new Date().toISOString(),
    };
  },

  // Get all tickets
  findAll: async (usersMap = {}) => {
    const [rows] = await db.query(
      `SELECT * FROM support_tickets ORDER BY created_at DESC`
    );
    return rows.map((row) => SupportTicket.mapToFrontend(row, usersMap));
  },

  // Get tickets by user ID (or all)
  findAllByUser: async (userId = null, usersMap = {}) => {
    if (!userId) return SupportTicket.findAll(usersMap);
    const [rows] = await db.query(
      `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((row) => SupportTicket.mapToFrontend(row, usersMap));
  },

  // Get single ticket
  findById: async (id, usersMap = {}) => {
    const [rows] = await db.query(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [id]
    );
    if (!rows.length) return null;
    return SupportTicket.mapToFrontend(rows[0], usersMap);
  },

  // Update ticket
  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(data);
    values.push(id);
    await db.query(`UPDATE support_tickets SET ${fields} WHERE id = ?`, values);
    return SupportTicket.findById(id);
  },

  // Update only status
  updateStatus: async (id, status) => {
    await db.query(`UPDATE support_tickets SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    return SupportTicket.findById(id);
  },

  // Delete ticket
  delete: async (id) => {
    await db.query(`DELETE FROM support_tickets WHERE id = ?`, [id]);
    return true;
  },
};

module.exports = SupportTicket;
