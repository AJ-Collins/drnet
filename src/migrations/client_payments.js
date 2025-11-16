const db = require("../config/db");

async function createPaymentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      package_id INT NOT NULL,
      transaction_id TEXT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );
  `);
  console.log("Payments table created");
}

module.exports = createPaymentsTable;
