const db = require('../config/db');

async function findAdminByUsername(username) {
  const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);
  return rows[0];
}

async function createAdmin(username, hashedPassword) {
  const [result] = await db.execute(
    "INSERT INTO admins (username, password) VALUES (?, ?)",
    [username, hashedPassword]
  );
  return result.insertId;
}

async function deleteAllAdmins() {
  const [result] = await db.execute("DELETE FROM admins");
  return result.affectedRows;
}

module.exports = { findAdminByUsername, createAdmin, deleteAllAdmins };
