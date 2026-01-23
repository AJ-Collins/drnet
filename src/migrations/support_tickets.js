const db = require("../config/db");

async function createSupportTicketsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_number VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      issue_subject VARCHAR(100) NOT NULL,
      description TEXT NULL,
      status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
      is_archived BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
  console.log("Support Tickets table created");
}

module.exports = createSupportTicketsTable;