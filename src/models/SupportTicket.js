const db = require("../config/db");

const SupportModel = {
    // TICKET OPERATIONS
    async findAll(includeArchived = false) {
        const sql = `
            SELECT t.*, u.first_name, u.second_name, u.phone as user_phone 
            FROM support_tickets t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.is_archived = ? 
            ORDER BY t.created_at DESC`;
        const [rows] = await db.query(sql, [includeArchived]);
        return rows;
    },

    async findById(id) {
        const [rows] = await db.query("SELECT * FROM support_tickets WHERE id = ?", [id]);
        return rows[0];
    },

    async create(data) {
        const { ticket_number, user_id, issue_subject, description } = data;
        const [result] = await db.query(
            "INSERT INTO support_tickets (ticket_number, user_id, issue_subject, description) VALUES (?, ?, ?, ?)",
            [ticket_number, user_id, issue_subject, description]
        );
        return result.insertId;
    },

    async updateStatus(id, status) {
        return await db.query("UPDATE support_tickets SET status = ? WHERE id = ?", [status, id]);
    },

    async archive(id) {
        return await db.query("UPDATE support_tickets SET is_archived = true WHERE id = ?", [id]);
    },

    async delete(id) {
        return await db.query("DELETE FROM support_tickets WHERE id = ?", [id]);
    },

    // MESSAGING OPERATIONS
    async getMessagesByTicket(ticketId) {
        const sql = `
            SELECT tm.*, u.first_name as user_name, s.first_name as staff_name
            FROM support_ticket_messages tm
            LEFT JOIN users u ON tm.sender_user_id = u.id
            LEFT JOIN staff s ON tm.sender_staff_id = s.id
            WHERE tm.ticket_id = ?
            ORDER BY tm.created_at ASC`;
        const [rows] = await db.query(sql, [ticketId]);
        return rows;
    },

    async saveMessage(data) {
        const { ticket_id, sender_user_id, sender_staff_id, message } = data;
        const [result] = await db.query(
            "INSERT INTO support_ticket_messages (ticket_id, sender_user_id, sender_staff_id, message) VALUES (?, ?, ?, ?)",
            [ticket_id, sender_user_id || null, sender_staff_id || null, message]
        );
        const [rows] = await db.query(`
            SELECT tm.*, s.first_name as staff_name, u.first_name as user_name
            FROM support_ticket_messages tm
            LEFT JOIN staff s ON tm.sender_staff_id = s.id
            LEFT JOIN users u ON tm.sender_user_id = u.id
            WHERE tm.id = ?`, [result.insertId]);
            
        return rows[0];
    },

    // ASSIGNMENT OPERATIONS
    async assignStaff(ticketId, staffId, note) {
        const sql = `
            INSERT INTO ticket_assignments (ticket_id, staff_id, assignment_note) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE assignment_note = ?, status = 'active'`;
        await db.query(sql, [ticketId, staffId, note, note]);
        
        // Fetch staff details for the SMS service
        const [staff] = await db.query("SELECT first_name, phone FROM staff WHERE id = ?", [staffId]);
        return staff[0];
    },

    async getAssignments(ticketId) {
        const sql = `
            SELECT ta.*, s.first_name, s.second_name, s.position, s.phone 
            FROM ticket_assignments ta
            JOIN staff s ON ta.staff_id = s.id
            WHERE ta.ticket_id = ? AND ta.status = 'active'`;
        const [rows] = await db.query(sql, [ticketId]);
        return rows;
    },

    async removeAssignment(ticketId, staffId) {
        return await db.query(
            "DELETE FROM ticket_assignments WHERE ticket_id = ? AND staff_id = ?",
            [ticketId, staffId]
        );
    },

    async getArchivedTickets() {
      const [rows] = await db.query(`
        SELECT st.*, u.first_name, u.second_name 
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        WHERE st.is_archived = TRUE 
        ORDER BY st.updated_at DESC
      `);
      return rows;
    },

    async setArchiveStatus(id, shouldArchive) {
      const [result] = await db.query(
        "UPDATE support_tickets SET is_archived = ? WHERE id = ?",
        [shouldArchive, id]
      );
      return result;
    }
};

module.exports = SupportModel;