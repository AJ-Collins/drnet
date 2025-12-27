const db = require("../config/db");

async function createFoldersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(50) DEFAULT 'fa-folder',
        isOpen BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = createFoldersTable;
