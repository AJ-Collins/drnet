const db = require("../config/db");

async function createProjectsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        budget DECIMAL(15, 2) NOT NULL,
        spent DECIMAL(15, 2) DEFAULT 0,
        deadline DATE NOT NULL,
        progress INT DEFAULT 0,
        transport VARCHAR(100) DEFAULT 'Pending',
        accommodation VARCHAR(100) DEFAULT 'Pending',
        deliveryStatus VARCHAR(100) DEFAULT 'Queued',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Expenses table created");
}

module.exports = createProjectsTable;
