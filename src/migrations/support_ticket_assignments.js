const db = require("../config/db");

async function createTicketAssignmentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      staff_id INT NOT NULL,
      assignment_note TEXT NULL,      
      role_in_ticket ENUM('primary', 'collaborator', 'viewer') DEFAULT 'primary',      
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('active', 'reassigned', 'completed') DEFAULT 'active',      
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE KEY unique_staff_per_ticket (ticket_id, staff_id)
    ) ENGINE=InnoDB;
  `);
  console.log("Multi-staff Ticket Assignments table created");
}

module.exports = createTicketAssignmentsTable;