const db = require('../config/db');

async function createClientPaymentsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS client_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
    `);
    console.log('Client Payments table created');
}

module.exports = createClientPaymentsTable;