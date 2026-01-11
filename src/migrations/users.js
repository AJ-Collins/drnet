const db = require("../config/db");

async function createUsersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NULL,
      second_name VARCHAR(50) NULL,
      email VARCHAR(100) NULL UNIQUE,
      phone VARCHAR(20) NULL UNIQUE,
      id_number VARCHAR(20) NULL,
      address TEXT NULL,
      password TEXT NULL,
      image MEDIUMTEXT DEFAULT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  `);
  console.log("Users table created");
}

module.exports = createUsersTable;
