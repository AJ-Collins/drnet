const db = require("../config/db");

async function createDocumentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50), -- Links to folder.id
      isManual BOOLEAN DEFAULT FALSE,
      project_ref VARCHAR(255),
      highlights TEXT,
      challenges TEXT,
      nextSteps TEXT,
      file_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES folders(id) ON DELETE SET NULL
  );
  `);
}

module.exports = createDocumentsTable;
