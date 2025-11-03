const db = require('../config/db');

async function createStaffClientAssignmentsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS staff_client_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        client_id INT NOT NULL,
        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment (staff_id, client_id),
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
    `);
    console.log('Staff Client Assignments table created');
}

module.exports = createStaffClientAssignmentsTable;