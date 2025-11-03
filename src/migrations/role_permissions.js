const db = require('../config/db');

async function createRolePermissionsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY(role_id, permission_id),
        FOREIGN KEY(role_id) REFERENCES roles(id),
        FOREIGN KEY(permission_id) REFERENCES permissions(id)
        );
    `);
    console.log('Role Permissions table created');
}

module.exports = createRolePermissionsTable;
