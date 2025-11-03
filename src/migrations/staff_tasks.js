const db = require('../config/db');

async function createStaffTasksTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS staff_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        client_id INT,
        task_type VARCHAR(100) NOT NULL,
        description TEXT,
        scheduled_time TIMESTAMP,
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        completed_date TIMESTAMP NULL,
        completed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (completed_by) REFERENCES staff(id) ON DELETE SET NULL
        );
    `);
    console.log('Staff Tasks table created');
}

module.exports = createStaffTasksTable;