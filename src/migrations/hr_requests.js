const db = require("../config/db");

async function createRequestsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        item VARCHAR(255) NOT NULL,
        qty VARCHAR(50) NOT NULL,
        cost DECIMAL(15, 2) NOT NULL,
        status ENUM('Pending Approval', 'Approved', 'Rejected') DEFAULT 'Pending Approval',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
  console.log("Expenses table created");
}

module.exports = createRequestsTable;
