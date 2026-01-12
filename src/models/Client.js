const db = require("../config/db");
const bcrypt = require("bcrypt");

const Client = {

    checkExisting: async (details, excludeId = null) => {
        const { email, phone, id_number } = details;
        let query = "SELECT email, phone, id_number FROM users WHERE (email = ? OR phone = ? OR id_number = ?)";
        let params = [email, phone, id_number];

        if (excludeId) {
            query += " AND id != ?";
            params.push(excludeId);
        }

        const [rows] = await db.query(query, params);
        if (rows.length > 0) {
            if (rows[0].email === email) return "Email address already exists.";
            if (rows[0].phone === phone) return "Phone number already exists.";
            if (rows[0].id_number === id_number) return "ID / Passport number already exists.";
        }
        return null;
    },

    create: async (data) => {
        const warning = await Client.checkExisting(data);
        if (warning) throw new Error(warning);

        const SALT_ROUNDS = 12;
        const plainPassword = data.password.toString(); 
        const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

        const dataToSave = { 
            ...data, 
            password: hashedPassword,
            is_active: true
        };

        const cols = Object.keys(dataToSave).join(", ");
        const placeholders = Object.keys(dataToSave).map(() => "?").join(", ");

        const [result] = await db.query(
            `INSERT INTO users (${cols}) VALUES (${placeholders})`,
            Object.values(dataToSave)
        );

        return result;
    },

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT id, first_name, second_name, email, phone, id_number, 
                   address, image, is_active, created_at 
            FROM users ORDER BY created_at DESC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT id, first_name, second_name, email, phone, id_number, 
                   address, image, is_active, created_at 
            FROM users WHERE id = ?
        `, [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const warning = await Client.checkExisting(data, id);
        if (warning) throw new Error(warning);
        
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