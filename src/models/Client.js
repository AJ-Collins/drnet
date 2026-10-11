const db = require("../config/db");
const bcrypt = require("bcrypt");

const Client = {

    checkExisting: async (details, excludeId = null) => {
        const email = details.email ? details.email.toLowerCase().trim() : null;
        const rawId = details.id_number ?? details.employee_id ?? null;
        const id_number = rawId !== null && rawId !== undefined && String(rawId).trim() !== ""
            ? String(rawId).trim()
            : null;
        const phone = details.phone ? String(details.phone).replace(/\s/g, '') : null;
        const excludeNum = excludeId !== null && excludeId !== undefined && excludeId !== ""
            ? Number(excludeId)
            : null;

        if (!email && !id_number && !phone) return null;

        // Build per-table conditions dynamically so empty values never
        // match other rows with empty values.
        const buildConds = (emailCol, identCol) => {
            const conds = [];
            const params = [];
            if (email) {
                conds.push(`LOWER(TRIM(${emailCol})) = ?`);
                params.push(email);
            }
            if (id_number) {
                conds.push(`TRIM(${identCol}) = ?`);
                params.push(id_number);
            }
            if (phone) {
                conds.push(`REPLACE(TRIM(phone), ' ', '') = ?`);
                params.push(phone);
            }
            return { clause: conds.join(" OR "), params };
        };

        const userBuilt = buildConds("email", "id_number");
        const staffBuilt = buildConds("email", "employee_id");

        // We check both tables. We use 'source' to identify where the conflict is.
        // NOTE: id is selected so self can be excluded on update.
        let query = `
            SELECT id, email, id_number, phone, 'user' as source FROM users WHERE (${userBuilt.clause})
            UNION
            SELECT id, email, employee_id as id_number, phone, 'staff' as source FROM staff WHERE (${staffBuilt.clause})
        `;

        let params = [...userBuilt.params, ...staffBuilt.params];

        const [rows] = await db.query(query, params);

        if (rows.length > 0) {
            // Filter out the current user when performing an update.
            // excludeId refers to users.id; staff rows never match it.
            const conflict = rows.find(r => !(excludeNum !== null && r.source === 'user' && Number(r.id) === excludeNum));

            if (conflict) {
                const tableLabel = conflict.source === 'staff' ? "an employee (Staff)" : "another client (User)";

                if (email && conflict.email && conflict.email.toLowerCase().trim() === email) return `Email already exists as ${tableLabel}.`;
                if (id_number && conflict.id_number && String(conflict.id_number).trim() === id_number) return `ID / Employee ID already exists as ${tableLabel}.`;
                if (phone && conflict.phone && String(conflict.phone).replace(/\s/g, '') === phone) return `Phone number already exists as ${tableLabel}.`;
                // Fallback when matched row can't be attributed (shouldn't happen)
                return `Details already exist as ${tableLabel}.`;
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

    findByIdRaw: async (id) => {
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const warning = await Client.checkExisting(data, id);
        if (warning) throw new Error(warning);

        const updates = { ...data };

        // Never store a plaintext / empty password
        if (updates.password !== undefined) {
            if (typeof updates.password !== "string" || updates.password.trim() === "") {
                delete updates.password;
            } else {
                updates.password = await bcrypt.hash(updates.password.toString(), 12);
            }
        }

        // Normalize before save (consistent with Staff model)
        if (updates.email) updates.email = updates.email.toLowerCase().trim();
        if (updates.phone) updates.phone = String(updates.phone).replace(/\s/g, '');
        if (updates.id_number !== undefined && updates.id_number !== null) {
            const trimmed = String(updates.id_number).trim();
            updates.id_number = trimmed === "" ? null : trimmed;
        }

        const fields = Object.keys(updates).map(k => `${k}=?`).join(", ");
        if (!fields) return { affectedRows: 0 };
        const values = [...Object.values(updates), id];
        const [result] = await db.query(`UPDATE users SET ${fields} WHERE id=?`, values);
        return result;
    },

    delete: async (id) => {
        return await db.query("DELETE FROM users WHERE id=?", [id]);
    }
};

module.exports = Client;