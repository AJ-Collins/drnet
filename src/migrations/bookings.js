const db = require("../config/db");

async function createBookingsTable() {
  await db.query(`
        CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(100) NULL,
        location VARCHAR(255) NULL,
        exact_location VARCHAR(255) NULL,
        package VARCHAR(100) NULL,
        extra_notes TEXT NULL,
        installation_date DATE NULL,
        status VARCHAR(50) NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
  console.log("Bookings table created");
}

module.exports = createBookingsTable;
