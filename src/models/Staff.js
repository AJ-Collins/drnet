const db = require("../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const Staff = {

    checkExisting: async (data) => {
        const email = data.email ? data.email.toLowerCase().trim() : null;
        const employee_id = data.employee_id ? data.employee_id.trim() : null;
        const phone = data.phone ? String(data.phone).replace(/\s/g, '') : null;

        if (!email && !employee_id && !phone) return null;

        // Cross-table check: employee_id vs id_number (plus phone)
        const query = `
            SELECT email, phone, employee_id AS ident, 'staff' AS source FROM staff
            WHERE (LOWER(TRIM(email)) = ? OR TRIM(employee_id) = ? OR REPLACE(TRIM(phone), ' ', '') = ?)
            UNION
            SELECT email, phone, id_number AS ident, 'user' AS source FROM users
            WHERE (LOWER(TRIM(email)) = ? OR TRIM(id_number) = ? OR REPLACE(TRIM(phone), ' ', '') = ?)
            LIMIT 1
        `;

        const params = [email, employee_id, phone, email, employee_id, phone];
        const [rows] = await db.query(query, params);

        if (rows.length > 0) {
            const conflict = rows[0];
            const tableLabel = conflict.source === 'staff' ? "an existing staff member" : "a registered client (User)";

            if (email && conflict.email?.toLowerCase().trim() === email) {
                return `Email already exists as ${tableLabel}`;
            }
            if (employee_id && conflict.ident?.trim() === employee_id) {
                return `Employee ID / National ID already exists as ${tableLabel}`;
            }
            if (phone && conflict.phone?.replace(/\s/g, '') === phone) {
                return `Phone number already exists as ${tableLabel}`;
            }
        }

        return null;
    },

    create: async (data) => {
        const warning = await Staff.checkExisting(data);
        if (warning) throw new Error(warning);

        const salary = data.basic_salary;
        delete data.basic_salary;

        if (!data.password) throw new Error("Password is required to create a staff.");

        if (data.password) {
            data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        // Normalize email and phone
        if (data.email) {
            data.email = data.email.toLowerCase().trim();
        }
        if (data.phone) {
            data.phone = data.phone.replace(/\s/g, '');
        }
        if (data.employee_id) {
            data.employee_id = data.employee_id.trim();
        }

        const cols = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const values = Object.values(data);

        const [result] = await db.query(
            `INSERT INTO staff (${cols}) VALUES (${placeholders})`,
            values
        );

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

    findByIdRaw: async (id) => {
        const [rows] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const [existing] = await db.query("SELECT id, email, phone, employee_id FROM staff WHERE id = ?", [id]);
        if (existing.length === 0) {
            throw new Error("Staff member not found in the database.");
        }

        if (data.email || data.phone || data.employee_id) {
            const checks = [];
            const params = [];

            if (data.email) {
                checks.push("LOWER(TRIM(email)) = ?");
                params.push(data.email.toLowerCase().trim());
            }
            if (data.phone) {
                checks.push("REPLACE(TRIM(phone), ' ', '') = ?");
                params.push(data.phone.replace(/\s/g, ''));
            }
            if (data.employee_id) {
                checks.push("TRIM(employee_id) = ?");
                params.push(data.employee_id.trim());
            }

            params.push(id); 

            const query = `SELECT id, email, phone, employee_id FROM staff WHERE (${checks.join(" OR ")}) AND id != ? LIMIT 1`;
            const [duplicate] = await db.query(query, params);

            if (duplicate.length > 0) {
                const dup = duplicate[0];
                if (data.email && dup.email?.toLowerCase().trim() === data.email.toLowerCase().trim()) {
                    throw new Error("Email already exists");
                }
                if (data.phone && dup.phone?.replace(/\s/g, '') === data.phone.replace(/\s/g, '')) {
                    throw new Error("Phone number already exists");
                }
                if (data.employee_id && dup.employee_id?.trim() === data.employee_id.trim()) {
                    throw new Error("Employee ID already exists");
                }
            }

            // Cross-table check against clients (users) — mirrors Staff.create.
            // Any match here is a conflict since excludeId only applies to staff.
            const userChecks = [];
            const userParams = [];

            if (data.email) {
                userChecks.push("LOWER(TRIM(email)) = ?");
                userParams.push(data.email.toLowerCase().trim());
            }
            if (data.phone) {
                userChecks.push("REPLACE(TRIM(phone), ' ', '') = ?");
                userParams.push(data.phone.replace(/\s/g, ''));
            }
            if (data.employee_id && data.employee_id.trim() !== "") {
                userChecks.push("TRIM(id_number) = ?");
                userParams.push(data.employee_id.trim());
            }

            if (userChecks.length > 0) {
                const [userDup] = await db.query(
                    `SELECT id, email, phone, id_number FROM users WHERE (${userChecks.join(" OR ")}) LIMIT 1`,
                    userParams
                );
                if (userDup.length > 0) {
                    const dup = userDup[0];
                    if (data.email && dup.email?.toLowerCase().trim() === data.email.toLowerCase().trim()) {
                        throw new Error("Email already exists as a registered client (User)");
                    }
                    if (data.phone && dup.phone?.replace(/\s/g, '') === data.phone.replace(/\s/g, '')) {
                        throw new Error("Phone number already exists as a registered client (User)");
                    }
                    if (data.employee_id && dup.id_number?.trim() === data.employee_id.trim()) {
                        throw new Error("Employee ID / National ID already exists as a registered client (User)");
                    }
                }
            }
        }

        if (data.password && data.password.trim() !== "") {
            data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        } else {
            delete data.password; 
        }

        const salary = data.basic_salary;
        delete data.basic_salary;

        if (data.email) {
            data.email = data.email.toLowerCase().trim();
        }
        if (data.phone) {
            data.phone = data.phone.replace(/\s/g, '');
        }
        if (data.employee_id) {
            data.employee_id = data.employee_id.trim();
        }

        const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
        const values = [...Object.values(data), id];

        const [result] = await db.query(
            `UPDATE staff SET ${fields} WHERE id = ?`,
            values
        );

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