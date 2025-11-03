const db = require('../config/db');

async function createPermissionsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(255)
        );
    `);
    console.log('Permissions table created');
}

module.exports = createPermissionsTable;