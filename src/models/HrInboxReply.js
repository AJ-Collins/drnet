const db = require("../config/db");

const HrInboxReply = {
    // Create new message
    async create(message_content, priority) {
        const [result] = await db.execute(
            "INSERT INTO hrinboxreply (message_content, priority, status) VALUES (?, ?, 'pending')",
            [message_content, priority || 'medium']
        );
        const [rows] = await db.execute("SELECT * FROM hrinboxreply WHERE id = ?", [result.insertId]);
        return rows[0];
    },

    // Get all records
    async getAll() {
        const [rows] = await db.execute("SELECT * FROM hrinboxreply ORDER BY created_at DESC");
        return rows;
    },

    // Admin: Update Status
   async updateStatus(id, status) {
        if (!status) {
            throw new Error("Status is required");
        }
        await db.execute(
            "UPDATE hrinboxreply SET status = ? WHERE id = ?",
            [status, id]
        );
        const [rows] = await db.execute(
            "SELECT * FROM hrinboxreply WHERE id = ?",
            [id]
        );

        return rows[0];
    },

    // Update Content/Priority (Edit)
    async update(id, data) {
        const { message_content, priority, status } = data;
        await db.execute(
            "UPDATE hrinboxreply SET message_content = ?, priority = ?, status = ? WHERE id = ?",
            [message_content, priority, status, id]
        );
        const [rows] = await db.execute("SELECT * FROM hrinboxreply WHERE id = ?", [id]);
        return rows[0];
    },

    async remove(id) {
        return await db.execute("DELETE FROM hrinboxreply WHERE id = ?", [id]);
    }
};

module.exports = HrInboxReply;