const db = require("../config/db");

async function createHrInboxReplyTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrinboxreply (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_content TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'read', 'processed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("HR Inbox table created.");
}

module.exports = createHrInboxReplyTable;