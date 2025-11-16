const db = require("../config/db");

async function createStaffTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NULL,
      second_name VARCHAR(50) NULL,
      email VARCHAR(100) NULL UNIQUE,
      phone VARCHAR(20) NULL UNIQUE,
      employee_id VARCHAR(50) NULL UNIQUE,
      role_id INT NULL,
      position VARCHAR(100) NULL,
      department VARCHAR(100) DEFAULT 'Staff',
      password TEXT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      hire_date DATE NULL,
      contract_end_date DATE NULL,
      image MEDIUMTEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    );
  `);
  console.log("Staff table created");
}

module.exports = createStaffTable;
