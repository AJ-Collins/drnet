const db = require('../config/db');

async function createContactsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
        console.log('Contacts table created');
    }
module.exports = createContactsTable;