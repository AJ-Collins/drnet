const db = require("../config/db");

const SupportTicket = {
  mapToFrontend: (row) => {
    let userName = "";

    if (row.user_id) {
      if (row.first_name || row.last_name) {
        userName = `${row.first_name || ""} ${row.second_name || ""}`.trim();
      } else {
        userName = row.email || "Unknown User";
      }
    }

    return {
      id: row.id,
      ticket_number: row.ticket_number,
      fullName: row.user_id ? `${row.subject} - ${userName}` : row.subject,
      phone: row.phone || "N/A",
      issue_type: row.issue_type,
      priority: row.priority,
      status: row.status,
      subject: row.subject,
      description: row.description || "",
      assigned_to: row.assigned_to,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  // Create new ticket
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

    // RETURN DIRECTLY — DO NOT USE findById()
    return SupportTicket.mapToFrontend({
      id: result.insertId,
      ticket_number,
      user_id,
      subject,
      issue_type,
      priority,
      description,
      status,
      assigned_to,
      created_at: new Date(),
      updated_at: new Date(),
    });
  },

  // Get ALL tickets
  findAll: async () => {
    const [rows] = await db.query(`
    SELECT st.*, u.first_name, u.second_name, u.email, u.phone
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    ORDER BY st.created_at DESC
  `);

    return rows.map(SupportTicket.mapToFrontend);
  },

  // Get tickets by USER
  findAllByUser: async (userId = null) => {
    if (!userId) return SupportTicket.findAll();

    const [rows] = await db.query(
      `
    SELECT st.*, u.first_name, u.second_name, u.email, u.phone
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    WHERE st.user_id = ?
    ORDER BY st.created_at DESC
  `,
      [userId]
    );

    return rows.map(SupportTicket.mapToFrontend);
  },

  // Get tickets assigned to STAFF
  findAllByStaff: async (staffId = null) => {
    if (!staffId) return [];

    const [rows] = await db.query(
      `
    SELECT st.*, u.first_name, u.second_name, u.email, u.phone
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    WHERE st.assigned_to = ?
    ORDER BY st.created_at DESC
    `,
      [staffId]
    );

    return rows.map(SupportTicket.mapToFrontend);
  },

  // Get one ticket by ID
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [id]
    );

    if (!rows.length) return null;
    return SupportTicket.mapToFrontend(rows[0]);
  },

  // Generic update
  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(", ");

    const values = [...Object.values(data), id];

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
