const db = require('../config/db');

async function createBookingsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(100),
        location VARCHAR(255),
        exact_location VARCHAR(255),
        package VARCHAR(100),
        extra_notes TEXT,
        installation_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Bookings table created');
}

module.exports = createBookingsTable;