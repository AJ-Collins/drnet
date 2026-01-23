const db = require("../config/db");

async function createTicketAssignmentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_ticket_id INT NOT NULL,
      staff_id INT NOT NULL,
      assignment_note TEXT NULL,     
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending', 'seen', 'completed') DEFAULT 'pending',
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE KEY unique_staff_per_assignment (assignment_ticket_id, staff_id)
    ) ENGINE=InnoDB;
  `);
  console.log("Multi-staff task Assignments table created");
}

module.exports = createTicketAssignmentsTable;