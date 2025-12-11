const db = require("../config/db");

const Guest = {
    create: async (data) => {
        const { fullName, phone } = data;

        const [result] = await db.query(
            `INSERT INTO users (first_name, phone, role_id, is_active)
             VALUES (?, ?, ?, ?)`,
             [fullName, phone, 4, 0]
        );

        return result.insertId;
    },

    findByPhone: async (phone) => {
        const [rows] = await db.query(
            `SELECT * FROM users WHERE phone = ? LIMIT 1`,
            [phone]
        );

        return rows[0];
    }
};

module.exports = Guest;