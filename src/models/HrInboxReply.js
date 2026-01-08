const db = require("../config/db");

const HrInboxReply = {
    // Create new message to CEO and return the full object
    async create(message_content, priority) {
        const [result] = await db.execute(
            "INSERT INTO hrinboxreply (message_content, priority, status) VALUES (?, ?, 'pending')",
            [message_content, priority || 'medium']
        );
        // Fetch the inserted row back immediately
        const [rows] = await db.execute("SELECT * FROM hrinboxreply WHERE id = ?", [result.insertId]);
        return rows[0];
    },

    // Get all messages for CEO view
    async getAll() {
        const [rows] = await db.execute(
            "SELECT * FROM hrinboxreply ORDER BY created_at DESC"
        );
        return rows;
    },

    // Update status and return the updated object
    async updateStatus(id, status) {
        await db.execute(
            "UPDATE hrinboxreply SET status = ? WHERE id = ?", 
            [status, id]
        );
        const [rows] = await db.execute("SELECT * FROM hrinboxreply WHERE id = ?", [id]);
        return rows[0];
    },

    // Delete a record
    async remove(id) {
        return await db.execute("DELETE FROM hrinboxreply WHERE id = ?", [id]);
    }
};

module.exports = HrInboxReply;