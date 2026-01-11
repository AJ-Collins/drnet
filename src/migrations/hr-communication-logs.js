const db = require("../config/db");

async function createHrCommsLogsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrcommunicationlogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        method ENUM('email', 'whatsapp', 'ceo', 'sms') NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Hr Expenses table created");
}

module.exports = createHrCommsLogsTable
