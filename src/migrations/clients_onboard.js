const db = require("../config/db");

async function createClientOnboardTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_onboard (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      second_name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      location VARCHAR(255) NOT NULL,
      package_id INT NOT NULL,
      staff_id INT NOT NULL,
      status ENUM('pending', 'active', 'inactive', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_client_onboard_package
        FOREIGN KEY (package_id)
        REFERENCES packages(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        CONSTRAINT fk_client_onboard_staff
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
  `);

  console.log("Client onboard table created");
}

module.exports = createClientOnboardTable;