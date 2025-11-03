const db = require('../config/db');

async function createRenewalsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS renewals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_name VARCHAR(100),
        amount DECIMAL(10,2),
        renewal_date DATE,
        expiry_date DATE,
        month VARCHAR(20),
        year INT,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Renewals table created');
}

module.exports = createRenewalsTable;