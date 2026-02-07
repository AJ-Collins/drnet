const db = require("../config/db");

// Helper Function for MySQL Datetime format - only used when creating reports
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const ReportModel = {
    // Save a draft or submit a final report for a staff member
    saveStaffReport: async (data) => {
        const { staff_id, department, content, status, report_date } = data;        
        const now = toSqlDatetime(new Date());
        
        const [existing] = await db.query(
            "SELECT id FROM staff_reports WHERE staff_id = ? AND report_date = ?", 
            [staff_id, report_date]
        );

        if (existing.length > 0) {
            // Update existing report
            const query = `
                UPDATE staff_reports 
                SET content = ?, status = ?, department = ?, updated_at = ?
                WHERE id = ?`;
            await db.query(query, [content, status, department, now, existing[0].id]);
            return { id: existing[0].id, action: "updated" };
        } else {
            // Create new report
            const query = `
                INSERT INTO staff_reports (staff_id, department, content, status, report_date, created_at) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            const [result] = await db.query(query, [staff_id, department, content, status, report_date, now]);
            return { id: result.insertId, action: "created" };
        }
    },

    // Get ALL staff reports without any filtering - frontend will handle filtering
    getStaffReportsFeed: async () => {
        const query = `
            SELECT 
                r.id,
                r.staff_id,
                r.department,
                r.content,
                r.status,
                r.report_date,
                r.created_at,
                r.updated_at,
                s.first_name, 
                s.second_name, 
                s.image, 
                s.position 
            FROM staff_reports r
            JOIN staff s ON r.staff_id = s.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Get reports for a specific staff member
    getMyReports: async (staff_id) => {
        const query = `
            SELECT 
                r.id,
                r.staff_id,
                r.department,
                r.content,
                r.status,
                r.report_date,
                r.created_at,
                r.updated_at
            FROM staff_reports r
            WHERE r.staff_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(query, [staff_id]);
        return rows;
    },

    // Delete staff report (only if it belongs to the user)
    deleteStaffReport: async (report_id, staff_id) => {
        const [existing] = await db.query(
            "SELECT id FROM staff_reports WHERE id = ? AND staff_id = ?",
            [report_id, staff_id]
        );

        if (existing.length === 0) {
            return { deleted: false };
        }

        await db.query("DELETE FROM staff_reports WHERE id = ?", [report_id]);
        return { deleted: true };
    },

    // Get a specific general report by date
    getAllGeneralReports: async () => {
        const query = `
            SELECT 
                g.*,
                s.first_name,
                s.second_name,
                s.position
            FROM general_reports g
            JOIN staff s ON g.supervisor_id = s.id
            ORDER BY g.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Get a single general report by ID
    getGeneralReportById: async (id) => {
        const query = `
            SELECT 
                g.*,
                s.first_name,
                s.second_name,
                s.position
            FROM general_reports g
            JOIN staff s ON g.supervisor_id = s.id
            WHERE g.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    },

    // Save Supervisor Draft or Final
    saveGeneralReport: async (data) => {
        const { 
            supervisor_id, report_date, status,
            ops_summary, ops_installs, ops_pending,
            staff_summary, support_summary, is_urgent, conclusion
        } = data;
        
        const now = toSqlDatetime(new Date());
        
        const [existing] = await db.query(
            "SELECT id FROM general_reports WHERE report_date = ?", 
            [report_date]
        );

        if (existing.length > 0) {
            // Update existing general report
            const query = `
                UPDATE general_reports SET 
                    supervisor_id = ?, 
                    ops_summary = ?, 
                    ops_installs = ?, 
                    ops_pending = ?,
                    staff_summary = ?, 
                    support_summary = ?, 
                    is_urgent = ?, 
                    conclusion = ?, 
                    status = ?, 
                    updated_at = ?
                WHERE id = ?
            `;
            const params = [
                supervisor_id, ops_summary, ops_installs, ops_pending,
                staff_summary, support_summary, is_urgent, conclusion, status, 
                now, existing[0].id
            ];
            await db.query(query, params);
            return { id: existing[0].id, action: "updated" };
        } else {
            // Create new general report
            const query = `
                INSERT INTO general_reports 
                (supervisor_id, report_date, ops_summary, ops_installs, ops_pending, 
                 staff_summary, support_summary, is_urgent, conclusion, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                supervisor_id, report_date, ops_summary, ops_installs, ops_pending, 
                staff_summary, support_summary, is_urgent, conclusion, status, now
            ];
            const [result] = await db.query(query, params);
            return { id: result.insertId, action: "created" };
        }
    },

    // Update general report (Admin only)
    updateGeneralReport: async (id, data) => {
        const {
            ops_summary, ops_installs, ops_pending,
            staff_summary, support_summary, is_urgent, conclusion, status
        } = data;
        
        const now = toSqlDatetime(new Date());
        
        const query = `
            UPDATE general_reports SET 
                ops_summary = ?, 
                ops_installs = ?, 
                ops_pending = ?,
                staff_summary = ?, 
                support_summary = ?, 
                is_urgent = ?, 
                conclusion = ?, 
                status = ?, 
                updated_at = ?
            WHERE id = ?
        `;
        const params = [
            ops_summary, ops_installs, ops_pending,
            staff_summary, support_summary, is_urgent, conclusion, status,
            now, id
        ];
        
        await db.query(query, params);
        return { id: id, action: "updated" };
    },

    // Delete general report (Admin only)
    deleteGeneralReport: async (id) => {
        const [existing] = await db.query(
            "SELECT id FROM general_reports WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return { deleted: false };
        }

        await db.query("DELETE FROM general_reports WHERE id = ?", [id]);
        return { deleted: true };
    }
};

module.exports = ReportModel;