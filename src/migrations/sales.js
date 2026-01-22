const db = require("../config/db");

async function createSalesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NULL, 
      item_name VARCHAR(255) NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      customer_contact VARCHAR(50),
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_status ENUM('paid', 'pending', 'partial', 'refunded') DEFAULT 'paid',
      payment_method VARCHAR(50) DEFAULT 'Cash',
      sold_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    );
  `);
  console.log("Sales table created");
}

module.exports = createSalesTable;