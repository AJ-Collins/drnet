const db = require("../config/db");

async function createRenewalsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS renewals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subscription_id INT NOT NULL,
      user_id INT NOT NULL,
      old_subscription_id INT NULL,
      amount DECIMAL(10,2) NOT NULL,
      old_amount DECIMAL(10,2),
      renewal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
      FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (old_subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL
    );
  `);

  console.log("Renewals table created");
}

module.exports = createRenewalsTable;
