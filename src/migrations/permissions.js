const db = require("../config/db");

async function createPermissionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Permissions table created");
}

module.exports = createPermissionsTable;
