const db = require("../config/db");

const Client = {
    create: async (data) => {
        const cols = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const values = Object.values(data);
        const [result] = await db.query(
            `INSERT INTO users (${cols}) VALUES (${placeholders})`,
            values
        );
        return result;
    },

    findAll: async () => {
        const [rows] = await db.query("SELECT * FROM users ORDER BY created_at DESC");
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const fields = Object.keys(data).map(k => `${k}=?`).join(", ");
        const values = [...Object.values(data), id];
        const [result] = await db.query(`UPDATE users SET ${fields} WHERE id=?`, values);
        return result;
    },

    delete: async (id) => {
        return await db.query("DELETE FROM users WHERE id=?", [id]);
    }
};

module.exports = Client;