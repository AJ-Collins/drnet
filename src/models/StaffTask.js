const db = require("../config/db");

const StaffTask = {
  create: async (data) => {
    const {
      staff_id,
      client_id,
      task_type,
      description,
      scheduled_time,
      priority,
      status,
      completed_date,
      completed_by,
    } = data;
    const [result] = await db.query(
      `INSERT INTO staff_tasks (staff_id, client_id, task_type, description, scheduled_time, priority, status, completed_date, completed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        client_id,
        task_type,
        description,
        scheduled_time,
        priority,
        status,
        completed_date,
        completed_by,
      ]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.query(`SELECT * FROM staff_tasks`);
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM staff_tasks WHERE id=?`, [id]);
    return result;
  },
};

module.exports = StaffTask;
