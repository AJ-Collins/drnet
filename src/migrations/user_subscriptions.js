const db = require("../config/db");

async function createUserSubscriptionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        package_id INT NULL,
        start_date DATE NULL,
        expiry_date DATE NULL,
        status VARCHAR(255) DEFAULT 'active',
        payment_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
    );
  `);
  console.log("Renewals table created");
}

module.exports = createUserSubscriptionsTable;
