const bcrypt = require("bcryptjs");
const db = require("../config/db");

const Staff = {
  create: async (data) => {
    const {
      first_name,
      second_name,
      email,
      phone,
      role_id,
      department,
      password,
      is_active,
      hire_date,
      contract_end_date,
      image,
      role,
      idNumber,
    } = data;

    const employee_id = idNumber || data.employee_id || null;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const position = role || data.position || "N/A";

    const [result] = await db.query(
      `INSERT INTO staff (
        first_name, second_name, email, phone, employee_id, role_id, position,
        department, password, is_active, hire_date, contract_end_date, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        second_name,
        email,
        phone,
        employee_id,
        role_id || 3,
        position,
        department,
        hashedPassword,
        is_active ?? true,
        hire_date,
        contract_end_date,
        image,
      ]
    );
    return result;
  },

  // 🔹 Get all staff with roles and normalize data
  findAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        s.*, 
        r.name AS role_name
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      ORDER BY s.created_at DESC
    `);

    return rows.map(formatStaff);
  },

  // 🔹 Get single staff member with role
  findById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT 
        s.*, 
        r.name AS role_name
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      WHERE s.id = ?
    `,
      [id]
    );

    return rows[0] ? formatStaff(rows[0]) : null;
  },

  findByRole: async (roleId) => {
    const [rows] = await db.query(
      `SELECT s.*, r.name AS role_name
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      WHERE s.role_id = ?
      ORDER BY s.created_at DESC`,
      [roleId]
    );

    return rows.map(formatStaff);
  },

  findAllWithSalary: async () => {
    const [rows] = await db.query(`
    SELECT 
      s.*, 
      r.name AS role_name,
      ss.basic_salary,
      ss.commision,
      ss.deductions
    FROM staff s
    LEFT JOIN roles r ON s.role_id = r.id
    LEFT JOIN staff_salaries ss 
      ON ss.staff_id = s.id
      AND ss.effective_from = (
        SELECT MAX(effective_from) 
        FROM staff_salaries 
        WHERE staff_id = s.id
      )
    WHERE r.name != 'Admin' OR r.name IS NULL
    ORDER BY s.created_at DESC
  `);

    return rows.map((member) => ({
      ...formatStaff(member),
      salary: {
        basic_salary: Number(member.basic_salary || 0),
        commission: Number(member.commission || 0),
        deductions: Number(member.deductions || 0),
      },
    }));
  },

  // Update staff
  update: async (id, data) => {
    // Map frontend fields to DB columns
    if (data.idNumber) {
      data.employee_id = data.idNumber;
      delete data.idNumber;
    }

    // Map role_legacy to position
    if (data.role_legacy) {
      data.position = data.role_legacy;
      delete data.role_legacy;
    } else if (data.role) {
      data.position = data.role;
      delete data.role;
    }

    // Only include role_id if provided
    if (data.role_id !== undefined) {
      data.role_id = Number(data.role_id); // ensure it's a number
    }

    let salaryNum;
    if (data.basic_salary !== undefined) {
      salaryNum = Number(data.basic_salary);
      delete data.basic_salary;
    }

    // Optional: hash password if provided
    if (data.password) {
      const bcrypt = require("bcryptjs");
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Build staff update query
    const fields = Object.keys(data)
      .map((k) => `${k}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);

    const [result] = await db.query(
      `UPDATE staff SET ${fields} WHERE id=?`,
      values
    );

    if (salaryNum !== undefined) {
      // Delete any existing salary record
      await db.query(`DELETE FROM staff_salaries WHERE staff_id = ?`, [id]);

      // Insert new salary record
      await db.query(
        `INSERT INTO staff_salaries (staff_id, basic_salary, effective_from)
       VALUES (?, ?, NOW())`,
        [id, salaryNum]
      );
    }

    return result;
  },

  // 🔹 Delete staff
  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM staff WHERE id=?`, [id]);
    return result;
  },
};

// Get staff raw (include password)
Staff.findByIdRaw = async (id) => {
  const [rows] = await db.query(`SELECT * FROM staff WHERE id = ?`, [id]);
  return rows[0] || null;
};

// 🔹 Helper to normalize staff record for frontend
function formatStaff(member) {
  return {
    id: member.id,
    name:
      `${member.first_name || ""} ${member.second_name || ""}`.trim() ||
      "No Name",
    email: member.email || "No Email",
    phone: member.phone || "N/A",
    employeeId: member.employee_id || "N/A",
    position: member.position || "N/A",
    department: member.department || "Staff",
    role: member.role_name || "Unassigned",
    status: member.is_active ? "Active" : "Inactive",
    hireDate: member.hire_date || "N/A",
    contractEnd: member.contract_end_date || "N/A",
    lastPayment: member.debt || "0.00",
    paymentStatus: member.paid_subscription ? "Paid" : "Unpaid",
    image: member.image || null,
  };
}

module.exports = Staff;
