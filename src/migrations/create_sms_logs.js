const db = require("../config/db");

async function createSmsLogsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sms_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subscription_id INT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        message_type ENUM('reminder', 'receipt', 'custom') DEFAULT 'custom',
        message_body TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
        INDEX (subscription_id),
        INDEX (sent_at) 
    );
  `);
  console.log("HR Inbox table created.");
}

module.exports = createSmsLogsTable;