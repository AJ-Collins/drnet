const db = require("../config/db");

async function createTeamMessagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS team_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      sender_type VARCHAR(255) DEFAULT 'staff',
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Team Messages table created");
}

module.exports = createTeamMessagesTable;
