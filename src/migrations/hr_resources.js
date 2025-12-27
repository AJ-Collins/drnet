const db = require("../config/db");

async function createResourcesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        item VARCHAR(255) NOT NULL,
        status VARCHAR(100) DEFAULT 'Active',
        cost DECIMAL(15, 2) NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);
  console.log("Expenses table created");
}

module.exports = createResourcesTable;
