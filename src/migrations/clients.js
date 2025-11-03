const db = require('../config/db');

async function createClientsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20) NOT NULL UNIQUE,
      address TEXT,
      package_type VARCHAR(100) DEFAULT 'Basic',
      monthly_fee DECIMAL(10,2) DEFAULT 29.99,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      password TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      last_payment_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log('Clients table created');
}

module.exports = createClientsTable;
