const db = require("../config/db");

const HrInbox = {
    // Get active messages
    async getAllActive() {
        const [rows] = await db.execute(
            "SELECT * FROM hrinbox WHERE status != 'archived' ORDER BY created_at DESC"
        );
        return rows;
    },

    // Add new message
    async create(content, priority) {
        const [result] = await db.execute(
            "INSERT INTO hrinbox (message_content, priority, status) VALUES (?, ?, 'pending')",
            [content, priority || 'normal']
        );
        // Fetch the inserted row back
        const [rows] = await db.execute("SELECT * FROM hrinbox WHERE id = ?", [result.insertId]);
        return rows[0];
    },

    async update(id, content, priority) {
        await db.execute(
            "UPDATE hrinbox SET message_content = ?, status = 'pending', is_seen = FALSE, priority = ? WHERE id = ?",
            [content, priority, id]
        );
        const [rows] = await db.execute("SELECT * FROM hrinbox WHERE id = ?", [id]);
        return rows[0];
    },

    // Mark unseen as seen
    async markAllAsSeen() {
        return await db.execute(
            "UPDATE hrinbox SET is_seen = TRUE, seen_at = NOW() WHERE is_seen = FALSE"
        );
    },

    async setProcessed(id) {
        return await db.execute(
            "UPDATE hrinbox SET status = 'processed', processed_at = NOW() WHERE id = ?",
            [id]
        );
    },

    // Delete
    async remove(id) {
        return await db.execute("DELETE FROM hrinbox WHERE id = ?", [id]);
    }
};

module.exports = HrInbox;