const db = require("../config/db");

async function createAdminsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NULL,
      second_name VARCHAR(50) NULL,
      password TEXT NULL,
      title VARCHAR(100) DEFAULT NULL,
      role_id INT NULL,
      email VARCHAR(100) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      address TEXT NULL,
      image MEDIUMTEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    );
  `);
  console.log("Admins table created");
}

module.exports = createAdminsTable;
