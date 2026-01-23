const db = require("../config/db");

async function createSupportTicketMessagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      sender_user_id INT NULL,
      sender_staff_id INT NULL,      
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,            
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (sender_staff_id) REFERENCES staff(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
  console.log("Support Ticket Messages table created");
}

module.exports = createSupportTicketMessagesTable;