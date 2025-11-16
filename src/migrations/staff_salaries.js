const db = require("../config/db");

async function createStaffSalariesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_salaries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      basic_salary DECIMAL(10,2) NOT NULL,
      commision DECIMAL(10,2) DEFAULT 0.00,
      bonuses DECIMAL(10,2) DEFAULT 0.00,
      deductions DECIMAL(10,2) DEFAULT 0.00,
      net_salary DECIMAL(10,2) DEFAULT 0.00,
      effective_from DATE DEFAULT NULL,
      effective_to DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
  `);
  console.log("Staff Salaries table created");
}

module.exports = createStaffSalariesTable;
