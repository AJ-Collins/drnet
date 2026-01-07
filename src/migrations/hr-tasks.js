const db = require("../config/db");

async function createHrTasksTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrtasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description TEXT NOT NULL,
      category VARCHAR(255) DEFAULT 'Other',
      duration VARCHAR(50) DEFAULT 'N/A',
      task_date DATE NOT NULL,
      status ENUM('pending', 'completed', 'suspended') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("HR Tasks table created successfully.");
}

module.exports = createHrTasksTable;