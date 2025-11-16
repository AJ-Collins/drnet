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
      role_id INT NULL,
      package_id INT NULL,
      paid_subscription BOOLEAN DEFAULT FALSE,
      last_payment_date DATE,
      expiry_date DATE,
      debt DECIMAL(10,2) DEFAULT 0.00,
      router_purchased BOOLEAN DEFAULT FALSE,
      router_cost DECIMAL(10,2) DEFAULT 0.00,
      image MEDIUMTEXT DEFAULT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
  );
  `);
  console.log("Users table created");
}

module.exports = createUsersTable;
