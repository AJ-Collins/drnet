const db = require("../config/db");

async function createCommentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        text TEXT NOT NULL,
        time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);
  console.log("Expenses table created");
}

module.exports = createCommentsTable;
