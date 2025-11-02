const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function createDefaultAdmin() {
  const username = 'drnet';
  const password = 'Janam@2030';

  try {
    console.log('🔍 Checking if admin exists...');

    const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);

    if (rows.length > 0) {
      console.log(`⚠️ Admin with username '${username}' already exists.`);
      return;
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('📝 Inserting new admin into database...');
    await db.execute("INSERT INTO admins (username, password) VALUES (?, ?)", [
      username.toLowerCase(),
      hashedPassword
    ]);

    console.log(`✅ Admin created successfully!`);
    console.log(`🔑 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  }
}

module.exports = createDefaultAdmin;
