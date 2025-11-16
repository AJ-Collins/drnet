const db = require("../config/db");

const StaffSalary = {
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
};

module.exports = StaffSalary;
