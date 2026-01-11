const db = require("../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const Staff = {
    create: async (data) => {
        if (data.password) data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        const cols = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const [result] = await db.query(`INSERT INTO staff (${cols}) VALUES (${placeholders})`, Object.values(data));
        return result;
    },

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT s.*, r.name as role_name FROM staff s 
            LEFT JOIN roles r ON s.role_id = r.id ORDER BY s.created_at DESC
        `);
        return rows;
    },

    update: async (id, data) => {
        if (data.password) data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        
        // Handle Salary if present in the update object
        let salary = data.basic_salary;
        delete data.basic_salary;

        const fields = Object.keys(data).map(k => `${k}=?`).join(", ");
        const values = [...Object.values(data), id];
        const [result] = await db.query(`UPDATE staff SET ${fields} WHERE id=?`, values);

        if (salary !== undefined) {
            await db.query("DELETE FROM staff_salaries WHERE staff_id = ?", [id]);
            await db.query("INSERT INTO staff_salaries (staff_id, basic_salary, effective_from) VALUES (?, ?, NOW())", [id, salary]);
        }
        return result;
    },

    delete: async (id) => {
        return await db.query("DELETE FROM staff WHERE id=?", [id]);
    }
};

module.exports = Staff;