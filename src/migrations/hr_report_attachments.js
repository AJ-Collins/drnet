const db = require("../config/db");

async function createReportAttachmentsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS report_attachments (
      report_id INT,
      document_id INT,
      PRIMARY KEY (report_id, document_id),
      FOREIGN KEY (report_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );
  `);
}

module.exports = createReportAttachmentsTable;
