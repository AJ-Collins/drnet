const db = require("../config/db");

async function createRolesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Roles table created");
}

module.exports = createRolesTable;
