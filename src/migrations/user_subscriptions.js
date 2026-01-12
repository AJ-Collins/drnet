const db = require("../config/db");

async function createUserSubscriptionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        package_id INT NULL,
        start_date DATETIME NULL,
        expiry_date DATETIME NULL,
        status VARCHAR(255) DEFAULT 'inactive',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
    );
  `);
  console.log("User subscriptions table created (without payment_id FK)");
}

module.exports = createUserSubscriptionsTable;
