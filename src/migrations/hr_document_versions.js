const db = require("../config/db");

async function createDocumentVersionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS document_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT,
        version_number INT DEFAULT 1,
        note VARCHAR(255),
        date_created DATE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);
}

module.exports = createDocumentVersionsTable;
