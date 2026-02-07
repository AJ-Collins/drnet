const db = require("../config/db");

async function createReportsTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        department VARCHAR(50) NOT NULL COMMENT 'ops, support, sales, etc',
        content TEXT NULL,
        status ENUM('draft', 'submitted') DEFAULT 'draft',
        report_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
      );
    `);
    console.log("Staff Reports table created");

    await db.query(`
      CREATE TABLE IF NOT EXISTS general_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supervisor_id INT NOT NULL,
        report_date DATE NOT NULL,
        
        ops_summary TEXT NULL,
        ops_installs INT DEFAULT 0,
        ops_pending INT DEFAULT 0,
        
        staff_summary TEXT NULL,
        
        support_summary TEXT NULL,
        is_urgent BOOLEAN DEFAULT FALSE,
        
        conclusion TEXT NULL,
        
        status ENUM('draft', 'submitted') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supervisor_id) REFERENCES staff(id) ON DELETE CASCADE
      );
    `);
    console.log("General Reports table created");

  } catch (error) {
    console.error("Reports Migration failed:", error.message);
    throw error;
  }
}

module.exports = createReportsTables;