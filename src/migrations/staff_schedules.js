const db = require("../config/db");

async function createStaffSchedulesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      schedule_type VARCHAR(50) DEFAULT 'daily',
      task_description TEXT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      day_of_week TEXT NULL,
      month INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
  `);
  console.log("Staff Schedules table created");
}

module.exports = createStaffSchedulesTable;
