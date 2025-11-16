const db = require("../config/db");

async function createClientPaymentReceiptsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      payment_id INT NULL,
      receipt_number VARCHAR(50) NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      transaction_id VARCHAR(255),           -- added missing field
      note TEXT,                             -- added missing field
      status VARCHAR(255) DEFAULT 'new',
      receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
    );
  `);
  console.log("Payment Receipts table created");
}

module.exports = createClientPaymentReceiptsTable;
