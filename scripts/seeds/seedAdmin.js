const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

(async () => {
  try {
    console.log("✅ Connected to MySQL");

    const [existing] = await db.execute("SELECT * FROM admins WHERE username = ?", ['admin']);
    if (existing.length > 0) {
      console.log("🔁 Removing existing admin...");
      await db.execute("DELETE FROM admins WHERE username = ?", ['admin']);
    }

    const hashed = await bcrypt.hash('12345', 10);
    await db.execute("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashed]);

    console.log("✅ Admin seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
})();
