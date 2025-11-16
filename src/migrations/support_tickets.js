const db = require("../config/db");

async function createSupportTicketsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_number VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      issue_type VARCHAR(100),
      priority VARCHAR(50) DEFAULT 'medium',
      description TEXT,
      status VARCHAR(50) DEFAULT 'open',
      assigned_to INT NULL, -- optional staff/admin assignment
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);
  console.log("Support Tickets table created");
}

module.exports = createSupportTicketsTable;
