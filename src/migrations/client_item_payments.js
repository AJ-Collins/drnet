const db = require("../config/db");

async function createClientItemPaymentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_item_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_purchase_id INT NOT NULL,
      transaction_id VARCHAR(255) NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_purchase_id) REFERENCES client_item_purchases(id) ON DELETE CASCADE
    );
  `);
  console.log("Client Item Payments table created");
}

module.exports = createClientItemPaymentsTable;
