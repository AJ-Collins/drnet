const db = require("../config/db");

const StaffPayslip = {
  create: async (data) => {
    const {
      staff_id,
      salary_id,
      pay_period,
      allowances,
      gross_pay,
      deductions,
      net_pay,
      payment_method,
      payment_date,
    } = data;
    const [result] = await db.query(
      `INSERT INTO staff_payslips (staff_id, salary_id, pay_period, allowances, gross_pay, deductions, net_pay, payment_method, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        salary_id,
        pay_period,
        allowances,
        gross_pay,
        deductions,
        net_pay,
        payment_method,
        payment_date,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM staff_payslips`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM staff_payslips WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = StaffPayslip;
