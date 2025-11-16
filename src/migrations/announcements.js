const db = require("../config/db");

async function createAnnouncementsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      posted_by_id INT NOT NULL,
      posted_by_type ENUM('staff', 'admin') NOT NULL DEFAULT 'admin',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Announcements table created");
}

module.exports = createAnnouncementsTable;
