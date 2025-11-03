const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

async function ensureAdmin() {
  try {
    console.log("Connected to MySQL");

    // Check if admin exists
    const [existing] = await db.execute("SELECT * FROM admins WHERE username = ?", ['admin']);
    if (existing.length > 0) {
      console.log("Removing existing admin...");
      await db.execute("DELETE FROM admins WHERE username = ?", ['admin']);
    }

    // Create default admin
    const hashed = await bcrypt.hash('12345', 10);
    await db.execute("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashed]);

    console.log("Default admin ensured successfully!");
  } catch (err) {
    console.error("Admin creation error:", err);
    throw err; // allow caller to handle
  }
}

module.exports = ensureAdmin;
