const db = require("../config/db");

const StaffSalary = {
  // Admin
  create: async (data) => {
    const { staff_id, basic_salary, effective_from, effective_to } = data;
    const [result] = await db.query(
      `INSERT INTO staff_salaries (staff_id, basic_salary, effective_from, effective_to)
       VALUES (?, ?, ?, ?)`,
      [staff_id, basic_salary, effective_from, effective_to]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM staff_salaries`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM staff_salaries WHERE id=?`, [
      id,
    ]);
    return result;
  },

  // Staff 
  // 1. Get the current active salary structure for a staff member
    getJobDetails: async (staffId) => {
        const query = `
            SELECT 
                s.position, s.department, s.hire_date,
                ss.basic_salary, ss.commision, ss.bonuses, ss.deductions, ss.net_salary,
                ss.effective_from
            FROM staff s
            JOIN staff_salaries ss ON s.id = ss.staff_id
            WHERE s.id = ? 
            ORDER BY ss.created_at DESC LIMIT 1
        `;
        const [rows] = await db.query(query, [staffId]);
        return rows[0];
    },

    // 2. Get all payslips generated for a staff member
    getPayslipHistory: async (staffId) => {
        const query = `
            SELECT 
                id, pay_period, gross_pay, net_pay, payment_date, payment_method, 
                allowance_description, deduction_description
            FROM staff_payslips
            WHERE staff_id = ?
            ORDER BY payment_date DESC
        `;
        const [rows] = await db.query(query, [staffId]);
        return rows;
    },

    // 3. Get a specific payslip for printing/downloading
    getPayslipById: async (payslipId, staffId) => {
        const query = `
            SELECT sp.*, 
                   s.first_name, s.second_name, s.employee_id, s.position, s.department
            FROM staff_payslips sp
            JOIN staff s ON sp.staff_id = s.id
            WHERE sp.id = ? AND sp.staff_id = ?
        `;
        const [rows] = await db.query(query, [payslipId, staffId]);
        return rows[0];
    }
};

module.exports = StaffSalary;
