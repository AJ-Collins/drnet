const db = require("../config/db");

async function createStaffAttendanceTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      time_in TIME NULL,
      time_out TIME NULL,
      status VARCHAR(20) DEFAULT 'present',
      attendance_date DATE NOT NULL,
      marked_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES staff(id) ON DELETE SET NULL,
      UNIQUE KEY unique_attendance (staff_id, attendance_date)
    );
  `);
  console.log("Staff Attendance table created");
}

module.exports = createStaffAttendanceTable;
