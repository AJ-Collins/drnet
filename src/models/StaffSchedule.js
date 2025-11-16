const db = require("../config/db");
const moment = require("moment");

const StaffSchedule = {

  create: async (data) => {
    const {
      staff_id,
      taskType,
      priority,
      date,
      time,
      duration,
      status,
      customerName,
      location,
      contactNumber,
      description,
      notes,
    } = data;

    // Convert fields to match DB schema
    const schedule_type = taskType;

    const start_time = time;

    const end_time = moment(time, "HH:mm")
      .add(duration, "hours")
      .format("HH:mm");

    const day_of_week = moment(date).format("dddd");  // Monday, Tuesday, etc.
    const month = moment(date).month() + 1;  // 1–12

    const is_active = status === "Completed" ? 0 : 1;

    // Merge description + other fields into task_description
    const task_description = `
      Customer: ${customerName}
      Location: ${location}
      Contact: ${contactNumber}
      Priority: ${priority}
      Status: ${status}
      Description: ${description}
      Notes: ${notes}
    `.trim();

    const [result] = await db.query(
      `INSERT INTO staff_schedules 
        (staff_id, schedule_type, task_description, start_time, end_time, day_of_week, month, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        schedule_type,
        task_description,
        start_time,
        end_time,
        day_of_week,
        month,
        is_active,
      ]
    );

    return result.insertId;
  },


  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM staff_schedules WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  findAllForStaff: async (staff_id) => {
    const [rows] = await db.query(
      `SELECT * FROM staff_schedules 
       WHERE staff_id = ? 
       ORDER BY month, day_of_week, start_time`,
      [staff_id]
    );
    return rows;
  },

  update: async (id, staff_id, data) => {
    const {
      taskType,
      priority,
      date,
      time,
      duration,
      status,
      customerName,
      location,
      contactNumber,
      description,
      notes,
    } = data;

    // Recompute all mapped fields
    const schedule_type = taskType;

    const start_time = time;

    const end_time = moment(time, "HH:mm")
      .add(duration, "hours")
      .format("HH:mm");

    const day_of_week = moment(date).format("dddd");
    const month = moment(date).month() + 1;

    const is_active = status === "Completed" ? 0 : 1;

    const task_description = `
        Customer: ${customerName}
        Location: ${location}
        Contact: ${contactNumber}
        Priority: ${priority}
        Status: ${status}
        Description: ${description}
        Notes: ${notes}
    `.trim();

    await db.query(
      `UPDATE staff_schedules 
      SET schedule_type = ?, task_description = ?, start_time = ?, end_time = ?, 
          day_of_week = ?, month = ?, is_active = ?
      WHERE id = ? AND staff_id = ?`,
      [
        schedule_type,
        task_description,
        start_time,
        end_time,
        day_of_week,
        month,
        is_active,
        id,
        staff_id,
      ]
    );

    return true;
  },

  softDelete: async (id, staff_id) => {
    await db.query(
      `UPDATE staff_schedules SET is_active = 0 WHERE id = ? AND staff_id = ?`,
      [id, staff_id]
    );
    return true;
  },

  updateStatus: async (id, staff_id, status) => {
    const is_active = status === "Completed" ? 0 : 1;

    await db.query(
      `UPDATE staff_schedules SET is_active = ? WHERE id = ? AND staff_id = ?`,
      [is_active, id, staff_id]
    );
    return true;
  },
};

module.exports = StaffSchedule;
