const db = require("../config/db");

class StaffAssignments {
  // Get all assignments for a staff member (both tickets and tasks)
  static async getStaffAssignments(staffId) {
    const query = `
      SELECT 
        'ticket' as type,
        ta.id,
        ta.ticket_id,
        st.ticket_number,
        ta.staff_id,
        st.issue_subject,
        st.description as note,
        ta.assignment_note as instructions,
        ta.assigned_at,
        ta.status,
        st.status as ticket_status,
        st.updated_at,
        NULL as due_date,
        st.user_id,
        CONCAT(u.first_name, ' ', u.second_name) as client_name
      FROM ticket_assignments ta
      INNER JOIN support_tickets st ON ta.ticket_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE ta.staff_id = ? AND ta.status != 'reassigned'
      
      UNION ALL
      
      SELECT 
        'task' as type,
        a.id,
        NULL as ticket_id,
        a.assignment_ticket_id as ticket_number,
        a.staff_id,
        a.subject as issue_subject,
        a.assignment_note as note,
        a.assignment_note as instructions,
        a.assigned_at,
        a.status,
        NULL as ticket_status,
        a.assigned_at as updated_at,
        NULL as due_date,
        NULL as user_id,
        NULL as client_name
      FROM assignments a
      WHERE a.staff_id = ?
      
      ORDER BY assigned_at DESC
    `;
    
    const [rows] = await db.query(query, [staffId, staffId]);
    return rows;
  }

  // Get single ticket assignment details
  static async getTicketAssignment(ticketId, staffId) {
    const query = `
      SELECT 
        ta.id,
        ta.ticket_id,
        ta.staff_id,
        ta.assignment_note,
        ta.role_in_ticket,
        ta.assigned_at,
        ta.status,
        st.ticket_number,
        st.issue_subject,
        st.description,
        st.status as ticket_status,
        st.user_id,
        st.created_at,
        st.updated_at,
        CONCAT(u.first_name, ' ', u.second_name) as client_name,
        u.email as client_email,
        u.phone as client_phone
      FROM ticket_assignments ta
      INNER JOIN support_tickets st ON ta.ticket_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE ta.ticket_id = ? AND ta.staff_id = ?
    `;
    
    const [rows] = await db.query(query, [ticketId, staffId]);
    return rows[0];
  }

  // Get single task assignment details
  static async getTaskAssignment(assignmentId, staffId) {
    const query = `
      SELECT 
        id,
        assignment_ticket_id as ticket_number,
        staff_id,
        subject,
        assignment_note,
        assigned_at,
        status
      FROM assignments
      WHERE id = ? AND staff_id = ?
    `;
    
    const [rows] = await db.query(query, [assignmentId, staffId]);
    return rows[0];
  }

  // Get ticket messages
  static async getTicketMessages(ticketId) {
    const query = `
      SELECT 
        tm.id,
        tm.ticket_id,
        tm.sender_user_id,
        tm.sender_staff_id,
        tm.message,
        tm.created_at,
        CONCAT(u.first_name, ' ', u.second_name) as user_name,
        CONCAT(s.first_name, ' ', s.second_name) as staff_name
      FROM support_ticket_messages tm
      LEFT JOIN users u ON tm.sender_user_id = u.id
      LEFT JOIN staff s ON tm.sender_staff_id = s.id
      WHERE tm.ticket_id = ?
      ORDER BY tm.created_at ASC
    `;
    
    const [rows] = await db.query(query, [ticketId]);
    return rows;
  }

  // Send message to ticket
  static async sendTicketMessage(ticketId, staffId, message) {
    const query = `
      INSERT INTO support_ticket_messages (ticket_id, sender_staff_id, message)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await db.query(query, [ticketId, staffId, message]);
    
    // Update ticket updated_at timestamp
    await db.query(
      'UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [ticketId]
    );
    
    return result.insertId;
  }

  // Update ticket assignment status
  static async updateTicketAssignmentStatus(ticketId, staffId, status) {
    const query = `
      UPDATE ticket_assignments 
      SET status = ?
      WHERE ticket_id = ? AND staff_id = ?
    `;
    
    const [result] = await db.query(query, [status, ticketId, staffId]);
    
    // If marking as completed, also update ticket status
    if (status === 'completed') {
      await db.query(
        'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['resolved', ticketId]
      );
    }
    
    return result.affectedRows > 0;
  }

  // Update task assignment status
  static async updateTaskAssignmentStatus(assignmentId, staffId, status) {
    const query = `
      UPDATE assignments 
      SET status = ?
      WHERE id = ? AND staff_id = ?
    `;
    
    const [result] = await db.query(query, [status, assignmentId, staffId]);
    return result.affectedRows > 0;
  }

  // Mark assignment as seen
  static async markAsSeen(type, id, staffId) {
    if (type === 'ticket') {
      const query = `
        UPDATE ticket_assignments 
        SET status = 'active'
        WHERE ticket_id = ? AND staff_id = ? AND status = 'pending'
      `;
      await db.query(query, [id, staffId]);
    } else {
      const query = `
        UPDATE assignments 
        SET status = 'seen'
        WHERE id = ? AND staff_id = ? AND status = 'pending'
      `;
      await db.query(query, [id, staffId]);
    }
  }

  // Get assignment counts
  static async getAssignmentCounts(staffId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status IN ('active', 'seen') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM (
        SELECT status FROM ticket_assignments WHERE staff_id = ? AND status != 'reassigned'
        UNION ALL
        SELECT status FROM assignments WHERE staff_id = ?
      ) as all_assignments
    `;
    
    const [rows] = await db.query(query, [staffId, staffId]);
    return rows[0];
  }
}

module.exports = StaffAssignments;