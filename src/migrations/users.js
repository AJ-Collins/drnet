const db = require('../config/db');

async function createUsersTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        password TEXT NOT NULL,
        role_id INT NOT NULL,
        staff_role_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (staff_role_id) REFERENCES staff_roles(id)
        );
    `);

    console.log('Users table created');
}

module.exports = createUsersTable;