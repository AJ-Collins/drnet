const db = require("../config/db");

const Report = {};

Report.create = async (reportData) => {
  const {
    report_type,
    start_date,
    end_date,
    content,
    generated_by = "Supervisor",
    status = "pending"
  } = reportData;

  const year = new Date().getFullYear();

  // Step 1: Get next sequence number for this year
  const [rows] = await db.query(`
    SELECT COUNT(*) as count 
    FROM reports 
    WHERE reference LIKE ?
  `, [`REP-${year}-%`]);

  const nextNum = (rows[0].count || 0) + 1;
  const reference = `REP-${year}-${String(nextNum).padStart(4, '0')}`;

  // Step 2: Insert with generated reference
  const query = `
    INSERT INTO reports 
    (reference, report_type, start_date, end_date, content, generated_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(query, [
    reference,
    report_type,
    start_date,
    end_date,
    content,
    generated_by,
    status
  ]);

  const [newReport] = await db.query("SELECT * FROM reports WHERE id = ?", [result.insertId]);
  return newReport[0];
};

// Keep the rest of your methods unchanged
Report.findAll = async () => {
  const [rows] = await db.query(`SELECT * FROM reports ORDER BY generated_at DESC`);
  return rows;
};

Report.findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM reports WHERE id = ?", [id]);
  return rows[0] || null;
};

Report.updateStatus = async (id, status) => {
  const valid = ['pending', 'in_review', 'approved', 'rejected'];
  if (!valid.includes(status)) throw new Error("Invalid status");

  await db.query("UPDATE reports SET status = ? WHERE id = ?", [status, id]);
  const [rows] = await db.query("SELECT * FROM reports WHERE id = ?", [id]);
  return rows[0];
};

Report.delete = async (id) => {
  await db.query("DELETE FROM reports WHERE id = ?", [id]);
  return true;
};

module.exports = Report;