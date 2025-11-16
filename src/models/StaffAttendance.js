const db = require("../config/db");

const StaffAttendance = {
  create: async (data) => {
    const { staff_id, time_in, time_out, status, attendance_date, marked_by } =
      data;

    // Check if attendance already exists
    const [existing] = await db.query(
      `SELECT id FROM staff_attendance WHERE staff_id=? AND attendance_date=?`,
      [staff_id, attendance_date]
    );

    if (existing.length > 0) {
      // Return a structured response instead of throwing
      return {
        success: false,
        message: "Attendance for this staff member on this date already exists",
        existingId: existing[0].id,
      };
    }

    // Insert new attendance
    const [result] = await db.query(
      `INSERT INTO staff_attendance (staff_id, time_in, time_out, status, attendance_date, marked_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [staff_id, time_in, time_out, status, attendance_date, marked_by]
    );

    return {
      success: true,
      message: "Attendance created successfully",
      id: result.insertId,
    };
  },

  findAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        sa.id,
        sa.staff_id,
        sa.time_in,
        sa.time_out,
        sa.status,
        DATE_FORMAT(sa.attendance_date, '%Y-%m-%d') AS attendance_date,
        sa.created_at,
        sa.updated_at,
        CONCAT(s.first_name, ' ', s.second_name) AS marked_by
      FROM staff_attendance sa
      LEFT JOIN staff s ON sa.marked_by = s.id
    `);
    return rows;
  },

  findByStaffAndDate: async (staff_id, attendance_date) => {
    const [rows] = await db.query(
      `SELECT * FROM staff_attendance WHERE staff_id=? AND attendance_date=?`,
      [staff_id, attendance_date]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k}=?`)
      .join(",");
    const values = Object.values(data);
    values.push(id);
    const [result] = await db.query(
      `UPDATE staff_attendance SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.query(`DELETE FROM staff_attendance WHERE id=?`, [
      id,
    ]);
    return result;
  },
};

module.exports = StaffAttendance;
