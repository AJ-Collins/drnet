const db = require("../config/db");

const StaffAssignments = {
  // Get all assignments for a specific staff member
  getStaffTasks: async (staffId) => {
    const query = `
      SELECT 
        'task' as type,
        a.id,
        a.assignment_note as note,
        a.status,
        a.assigned_at,
        NULL as ticket_number,
        NULL as issue_subject
      FROM assignments a
      WHERE a.staff_id = ?
      
      UNION ALL
      
      SELECT 
        'ticket' as type,
        ta.id,
        ta.assignment_note as note,
        ta.status,
        ta.assigned_at,
        st.ticket_number,
        st.issue_subject
      FROM ticket_assignments ta
      JOIN support_tickets st ON ta.ticket_id = st.id
      WHERE ta.staff_id = ?
      ORDER BY assigned_at DESC
    `;
    const [rows] = await db.query(query, [staffId, staffId]);
    return rows;
  },

  // Post a message to a ticket
  addTicketMessage: async (ticketId, senderStaffId, message) => {
    const query = `
      INSERT INTO support_ticket_messages (ticket_id, sender_staff_id, message)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(query, [ticketId, senderStaffId, message]);
    return result.insertId;
  },

  // Update status of a ticket assignment
  updateAssignmentStatus: async (type, id, newStatus) => {
    const table = type === 'ticket' ? 'ticket_assignments' : 'assignments';
    const query = `UPDATE ${table} SET status = ? WHERE id = ?`;
    await db.query(query, [newStatus, id]);
    
    // If it's a ticket and marked completed,
    if (type === 'ticket' && newStatus === 'completed') {
       await db.query(`
         UPDATE support_tickets st
         JOIN ticket_assignments ta ON st.id = ta.ticket_id
         SET st.status = 'resolved'
         WHERE ta.id = ?
       `, [id]);
    }
  },

  getTicketMessages: async (ticketId) => {
    const query = `
      SELECT m.*, s.first_name as staff_name, u.first_name as user_name
      FROM support_ticket_messages m
      LEFT JOIN staff s ON m.sender_staff_id = s.id
      LEFT JOIN users u ON m.sender_user_id = u.id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
    `;
    const [rows] = await db.query(query, [ticketId]);
    return rows;
  }
};

module.exports = StaffAssignments;