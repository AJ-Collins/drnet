const db = require("../config/db");

async function createItemsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      serial_number VARCHAR(255) NULL,
      category VARCHAR(255) NULL,
      quantity INT DEFAULT 0,
      brand VARCHAR(255),
      unit_price DECIMAL(10,2) NULL,
      status VARCHAR(255) DEFAULT 'available',
      added_by INT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (added_by) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);
  console.log("Items table created");
}

module.exports = createItemsTable;
