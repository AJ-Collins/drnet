const db = require("../config/db");

async function clientsOnboardCommissionTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS onboard_commissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      onboard_id INT NOT NULL,
      staff_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (onboard_id) REFERENCES client_onboard(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
  `);
  console.log("Commission table created");
}

module.exports = clientsOnboardCommissionTable;