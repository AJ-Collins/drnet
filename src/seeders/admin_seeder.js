const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  try {
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT IGNORE INTO staff 
        (first_name, second_name, email, phone, employee_id, role_id, position, department, password, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Admin",
        "User",
        "admin@gmail.com",
        "0700000000",
        "ADM001",
        1,
        "Administrator",
        "Management",
        hashedPassword,
        true,
      ]
    );
    console.log("Admin user seeded with ID:", result.insertId);
  } catch (err) {
    console.error("Error seeding admin:", err);
    throw err;
  }
}

module.exports = seedAdmin;
