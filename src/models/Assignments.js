const db = require("../config/db");
const Staff = require("./Staff");

const Assignment = {
    /**
     * Get all staff members with their active assignment counts
     */
    getAllStaffWithAssignments: async () => {
        const query = `
            SELECT 
                s.*,
                r.name as role_name,
                COUNT(CASE WHEN a.status != 'completed' THEN 1 END) as active_assignments
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN assignments a ON s.id = a.staff_id
            GROUP BY s.id
            ORDER BY s.first_name ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Get a single staff member by ID
     */
    getStaffById: async (staffId) => {
        const query = `
            SELECT 
                s.*,
                r.name as role_name
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            WHERE s.id = ?
        `;
        const [rows] = await db.query(query, [staffId]);
        return rows[0];
    },

    /**
     * Get all assignments for a specific staff member
     */
    getStaffAssignments: async (staffId) => {
        const query = `
            SELECT 
                a.id,
                a.assignment_ticket_id,
                a.staff_id,
                a.subject,
                a.assignment_note,
                a.assigned_at,
                a.status,
                a.subject as issue_subject,
                a.assignment_note as note,
                a.assignment_note as instructions,
                    'task' as type,
                    a.assigned_at as updated_at
                FROM assignments a
                WHERE a.staff_id = ?
                ORDER BY 
                    CASE a.status 
                        WHEN 'pending' THEN 1
                        WHEN 'seen' THEN 2
                        WHEN 'completed' THEN 3
                    END,
                    a.assigned_at DESC
            `;
            const [rows] = await db.query(query, [staffId]);
            return rows;
        },

    /**
     * Get a single assignment by ID
     */
    getAssignmentById: async (assignmentId) => {
        const query = `
            SELECT 
                a.id,
                a.assignment_ticket_id,
                a.staff_id,
                a.subject,
                a.assignment_note,
                a.assigned_at,
                a.status,
                a.subject as issue_subject,
                a.assignment_note as note,
                a.assignment_note as instructions,
                'task' as type,
                s.first_name,
                s.second_name,
                s.email,
                s.phone
            FROM assignments a
            LEFT JOIN staff s ON a.staff_id = s.id
            WHERE a.id = ?
        `;
        const [rows] = await db.query(query, [assignmentId]);
        return rows[0];
    },

    /**
     * Generate unique assignment ticket ID
     */
    generateAssignmentTicketId: async () => {
        const prefix = 'TASK-';
        let ticketId;
        let exists = true;

        while (exists) {
            const number = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0');

            ticketId = `${prefix}${number}`;
            exists = await module.exports.checkTicketIdExists(ticketId);
        }

        return ticketId;
    },


    /**
     * Check if assignment ticket ID exists
     */
    checkTicketIdExists: async (ticketId) => {
        const query = `SELECT id FROM assignments WHERE assignment_ticket_id = ?`;
        const [rows] = await db.query(query, [ticketId]);
        return rows.length > 0;
    },

    /**
     * Create a new assignment
     */
    createAssignment: async (assignmentData) => {
        let assignmentTicketId;
        let exists = true;
        
        // Generate unique ticket ID
        while (exists) {
            assignmentTicketId = await Assignment.generateAssignmentTicketId();
            exists = await Assignment.checkTicketIdExists(assignmentTicketId);
        }
        
        const query = `
            INSERT INTO assignments (
                assignment_ticket_id,
                staff_id,
                subject,
                assignment_note,
                status
            ) VALUES (?, ?, ?, ?, 'pending')
        `;
        
        const [result] = await db.query(query, [
            assignmentTicketId,
            assignmentData.staff_id,
            assignmentData.subject,
            assignmentData.assignment_note || null
        ]);

        return {
            id: result.insertId,
            assignment_ticket_id: assignmentTicketId
        };
    },

    /**
     * Update an assignment
     */
    updateAssignment: async (assignmentId, assignmentData) => {
        const query = `
            UPDATE assignments 
            SET 
                staff_id = ?,
                subject = ?,
                assignment_note = ?
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [
            assignmentData.staff_id,
            assignmentData.subject,
            assignmentData.assignment_note || null,
            assignmentId
        ]);

        return result.affectedRows > 0;
    },

    /**
     * Mark assignment as completed
     */
    markAsCompleted: async (assignmentId) => {
        const query = `
            UPDATE assignments 
            SET status = 'completed'
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [assignmentId]);
        return result.affectedRows > 0;
    },

    /**
     * Mark assignment as seen
     */
    markAsSeen: async (assignmentId) => {
        const query = `
            UPDATE assignments 
            SET status = 'seen'
            WHERE id = ? AND status = 'pending'
        `;
        
        const [result] = await db.query(query, [assignmentId]);
        return result.affectedRows > 0;
    },

    /**
     * Delete an assignment
     */
    deleteAssignment: async (assignmentId) => {
        const query = `DELETE FROM assignments WHERE id = ?`;
        const [result] = await db.query(query, [assignmentId]);
        return result.affectedRows > 0;
    },

    /**
     * Get assignment statistics for a staff member
     */
    getStaffStats: async (staffId) => {
        const query = `
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN status != 'completed' THEN 1 END) as active_tasks,
                ROUND(
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / 
                    NULLIF(COUNT(*), 0), 
                    2
                ) as completion_rate
            FROM assignments
            WHERE staff_id = ?
        `;
        
        const [rows] = await db.query(query, [staffId]);
        return rows[0];
    },

    /**
     * Check if assignment exists
     */
    assignmentExists: async (assignmentId) => {
        const query = `SELECT id FROM assignments WHERE id = ?`;
        const [rows] = await db.query(query, [assignmentId]);
        return rows.length > 0;
    },

    /**
     * Get staff assignments count
     */
    getStaffAssignmentCount: async (staffId, status = null) => {
        let query = `SELECT COUNT(*) as count FROM assignments WHERE staff_id = ?`;
        const params = [staffId];
        
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        const [rows] = await db.query(query, params);
        return rows[0].count;
    },

    /**
     * Validate assignment data
     */
    validateAssignmentData: async (data, excludeId = null) => {
        const { staff_id, subject } = data;
        
        // Check required fields
        if (!staff_id) return "Staff member is required";
        if (!subject || subject.trim() === "") return "Subject is required";
        
        // Check if staff exists
        const staffExists = await Staff.findById(staff_id);
        if (!staffExists) return "Staff member not found";
        
        return null;
    }
};

module.exports = Assignment;