const db = require("../config/db");

async function createPackagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NULL,
      speed VARCHAR(50) NULL,
      classification VARCHAR(255),
      validity_days INT DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Packages table created");
}

module.exports = createPackagesTable;
