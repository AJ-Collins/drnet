const db = require("../config/db");

async function createHrBookingsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrbookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      packageId INT NOT NULL, /* Only storing the ID reference */
      notes TEXT NULL,
      date VARCHAR(50) NOT NULL,
      status ENUM('pending', 'completed', 'suspended') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      CONSTRAINT fk_booking_package 
      FOREIGN KEY (packageId) REFERENCES packages(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    );
  `);
  console.log("HR Bookings table created.");
}

module.exports = createHrBookingsTable;