const db = require("../config/db");

async function createHrInboxTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrinbox (
        id SERIAL PRIMARY KEY,
        message_content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        is_seen BOOLEAN DEFAULT FALSE,
        seen_at TIMESTAMP NULL,
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("HR Inbox table created.");
}

module.exports = createHrInboxTable;