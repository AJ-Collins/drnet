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
      packageId INT NOT NULL,
      extra_notes TEXT NULL,
      status ENUM('pending', 'conducted', 'completed') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY fk_bookings_packageId (packageId),
      CONSTRAINT fk_bookings_packageId 
        FOREIGN KEY (packageId) REFERENCES packages(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    );
  `);

  console.log("Bookings table created");
}

module.exports = createBookingsTable;
