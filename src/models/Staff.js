const db = require("../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const Staff = {

    checkExisting: async (details, excludeId = null) => {
        const { email, phone, employee_id } = details;
        let query = "SELECT email, phone, employee_id FROM staff WHERE (email = ? OR phone = ? OR employee_id = ?)";
        let params = [email, phone, employee_id];

        if (excludeId) {
            query += " AND id != ?";
            params.push(excludeId);
        }

        const [rows] = await db.query(query, params);
        if (rows.length > 0) {
            if (rows[0].email === email) return "Staff Email already exists.";
            if (rows[0].phone === phone) return "Staff Phone number already exists.";
            if (rows[0].employee_id === employee_id) return "Employee ID already exists.";
        }
        return null;
    },

    create: async (data) => {
        const warning = await Staff.checkExisting(data);
        if (warning) throw new Error(warning);

        const salary = data.basic_salary;
        delete data.basic_salary;

        if (data.password) data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        const cols = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const [result] = await db.query(`INSERT INTO staff (${cols}) VALUES (${placeholders})`, Object.values(data));

        if (salary !== undefined && salary !== null && salary !== '') {
            await db.query(
                "INSERT INTO staff_salaries (staff_id, basic_salary, effective_from) VALUES (?, ?, NOW())",
                [result.insertId, salary]
            );
        }

        return result;
    },

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT s.id, s.first_name, s.second_name, s.email, s.phone, 
                   s.employee_id, s.position, s.department, s.is_active, 
                   s.hire_date, image, r.name as role_name ,
                   ss.basic_salary
            FROM staff s 
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN staff_salaries ss ON s.id = ss.staff_id AND ss.effective_to IS NULL
            WHERE r.name != 'admin' OR r.name IS NULL
            ORDER BY s.created_at DESC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT s.id, s.first_name, s.second_name, s.email, s.phone, 
                   s.employee_id, s.position, s.department, s.role_id, image,
                   r.name as role_name ,
                   ss.basic_salary
            FROM staff s 
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN staff_salaries ss ON s.id = ss.staff_id AND ss.effective_to IS NULL
            WHERE s.id = ?
        `, [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const [existing] = await db.query("SELECT id FROM staff WHERE id = ?", [id]);
        if (existing.length === 0) {
            throw new Error("Staff member not found in the database.");
        }

        if (data.password && data.password.trim() !== "") {
            const SALT_ROUNDS = 12;
            data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        } else {
            delete data.password; 
        }
        
        const salary = data.basic_salary;
        delete data.basic_salary;

        const fields = Object.keys(data).map(k => `${k}=?`).join(", ");
        const values = [...Object.values(data), id];
        
        const [result] = await db.query(`UPDATE staff SET ${fields} WHERE id=?`, values);

        if (salary !== undefined && salary !== null && salary !== '') {
            const [existingSalary] = await db.query(
                "SELECT id FROM staff_salaries WHERE staff_id = ? AND effective_to IS NULL",
                [id]
            );
            
            if (existingSalary.length > 0) {
                await db.query(
                    "UPDATE staff_salaries SET basic_salary = ? WHERE staff_id = ? AND effective_to IS NULL",
                    [salary, id]
                );
            } else {
                await db.query(
                    "INSERT INTO staff_salaries (staff_id, basic_salary, effective_from) VALUES (?, ?, NOW())",
                    [id, salary]
                );
            }
        }
        
        return result;
    },

    delete: async (id) => {
        return await db.query("DELETE FROM staff WHERE id=?", [id]);
    },

    getRoles: async () => {
        const [rows] = await db.query("SELECT id, name FROM roles ORDER BY id DESC");
        return rows;
    }
};

module.exports = Staff;