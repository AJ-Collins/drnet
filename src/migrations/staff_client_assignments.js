const db = require("../config/db");

async function createAssignmentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clientName VARCHAR(100) NOT NULL,
      clientContact VARCHAR(50),
      serviceType VARCHAR(50) NOT NULL,
      priority VARCHAR(20) DEFAULT 'low',
      scheduledDate DATETIME NOT NULL,
      estimatedDuration DECIMAL(5,2),
      technicianId INT,
      supervisorId INT,
      description TEXT,
      requiredEquipment TEXT,
      status VARCHAR(20) DEFAULT 'assigned',
      address VARCHAR(255) NULL,
      completedAt DATETIME,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technicianId) REFERENCES staff(id) ON DELETE SET NULL,
      FOREIGN KEY (supervisorId) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);
  console.log("Assignments table created");
}

module.exports = createAssignmentsTable;
