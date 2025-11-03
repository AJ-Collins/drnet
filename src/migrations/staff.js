const db = require('../config/db');

async function createStaffTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        position VARCHAR(100) DEFAULT 'Staff Member',
        department VARCHAR(100) DEFAULT 'Technical',
        salary DECIMAL(10,2),
        password TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        hire_date DATE,
        contract_end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `);
    console.log('Staff table created');
}
module.exports = createStaffTable;