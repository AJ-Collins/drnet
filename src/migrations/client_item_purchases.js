const db = require("../config/db");

async function createClientItemPurchasesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_item_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255) NULL,
      last_name VARCHAR(255) NULL,
      item_id INT NOT NULL,
      quantity INT DEFAULT 1,
      total_amount DECIMAL(10,2) NOT NULL,
      purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_status VARCHAR(50) DEFAULT 'pending',
      notes TEXT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
  `);
  console.log("Client Item Purchases table created");
}

module.exports = createClientItemPurchasesTable;
