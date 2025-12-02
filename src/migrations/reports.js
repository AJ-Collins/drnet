const db = require("../config/db");

async function createReportsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reference VARCHAR(20) UNIQUE NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        content TEXT NOT NULL,
        status ENUM('pending','in_review','approved','rejected') DEFAULT 'pending',
        generated_by VARCHAR(100) NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (report_type),
        INDEX idx_date (generated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`DROP TRIGGER IF EXISTS auto_report_ref`);

    console.log("Reports table ready. Reference will be generated in app code.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
}

module.exports = createReportsTable;