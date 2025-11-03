const db = require('../config/db');

async function createRolesTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255)
        );
    `);
    console.log('Roles table created');
}

module.exports = createRolesTable;