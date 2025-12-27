const db = require("../config/db");

async function createTasksTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        role VARCHAR(255) DEFAULT 'Staff',
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('pending', 'progress', 'completed') DEFAULT 'pending',
        owner VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        dueDate DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Expenses table created");
}

module.exports = createTasksTable;
