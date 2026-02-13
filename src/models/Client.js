const db = require("../config/db");
const bcrypt = require("bcrypt");

const Client = {

    checkExisting: async (details, excludeId = null) => {
        const { email, id_number } = details;
        
        // We check both tables. We use 'source' to identify where the conflict is.
        let query = `
            SELECT email, id_number, 'user' as source FROM users WHERE (email = ? OR id_number = ?)
            UNION
            SELECT email, employee_id as id_number, 'staff' as source FROM staff WHERE (email = ? OR employee_id = ?)
        `;
        
        let params = [email, id_number, email, id_number];

        const [rows] = await db.query(query, params);

        if (rows.length > 0) {
            // Filter out the current user when performing an update
            const conflict = rows.find(r => !(excludeId && r.source === 'user' && r.id === excludeId));
            
            if (conflict) {
                const tableLabel = conflict.source === 'staff' ? "an employee (Staff)" : "another client (User)";
                
                if (conflict.email === email) return `Email already exists as ${tableLabel}.`;
                if (conflict.id_number === id_number) return `ID / Employee ID already exists as ${tableLabel}.`;
            }
        }
        return null;
    },

    create: async (data) => {
        const warning = await Client.checkExisting(data);
        if (warning) throw new Error(warning);

        const SALT_ROUNDS = 12;
        if (!data.password) throw new Error("Password is required to create a user.");
        const plainPassword = data.password.toString(); 
        const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        const { onboard_id, password, ...userFields } = data;

        const dataToSave = { 
            ...userFields, 
            password: hashedPassword,
            is_active: true
        };

        const cols = Object.keys(dataToSave).join(", ");
        const placeholders = Object.keys(dataToSave).map(() => "?").join(", ");

        const [result] = await db.query(
            `INSERT INTO users (${cols}) VALUES (${placeholders})`,
            Object.values(dataToSave)
        );

        if (onboard_id) {
            await db.query(
                `UPDATE client_onboard
                SET status = 'active', updated_at = NOW()
                WHERE id = ?`,
            [onboard_id]
        );
    }

        return result;
    },

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT id, first_name, second_name, email, phone, id_number, 
                   address, location, image, is_active, created_at 
            FROM users ORDER BY created_at DESC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT id, first_name, second_name, email, phone, id_number, 
                   address, location, image, is_active, created_at 
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