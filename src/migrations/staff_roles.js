const db = require('../config/db');

async function createStaffRolesTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS staff_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(50) NOT NULL,
        description VARCHAR(255)
        );
    `);

    console.log('Staff Roles table created');
}

module.exports = createStaffRolesTable;