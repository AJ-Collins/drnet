// db_setup.js
const db = require("../config/db");

async function createItemsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      serial_number VARCHAR(100) NOT NULL UNIQUE, 
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      brand VARCHAR(100),
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      status ENUM('in-stock', 'out-stock', 'maintenance') DEFAULT 'in-stock',
      current_holder VARCHAR(255) DEFAULT 'Store', -- Just a text record of where it is
      added_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (added_by) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);
}

module.exports = createItemsTable;