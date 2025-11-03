const db = require('../config/db');

async function createUsersTable() {

    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        package VARCHAR(100),
        location VARCHAR(255),
        phone VARCHAR(50),
        payment_date VARCHAR(50),
        expiry_date VARCHAR(50),
        debt DECIMAL(10,2),
        router_purchased BOOLEAN,
        router_cost DECIMAL(10,2),
        subscription_amount DECIMAL(10,2),
        paid_subscription BOOLEAN,
        last_renewal_date DATE,
        is_deleted BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
  `);
    console.log('Users table created');
}
module.exports = createUsersTable;