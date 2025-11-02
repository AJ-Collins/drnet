const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askPassword = () => {
  rl.question('Enter new password for "drnet": ', async (newPassword) => {
    try {
      const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", ['drnet']);
      if (rows.length === 0) {
        console.log('❌ Admin "drnet" not found');
        rl.close();
        process.exit();
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await db.execute("UPDATE admins SET password = ? WHERE username = ?", [hashed, 'drnet']);

      console.log('✅ Password updated successfully for "drnet"');
      rl.close();
      process.exit();
    } catch (err) {
      console.error('❌ Error:', err);
      rl.close();
      process.exit(1);
    }
  });
};

askPassword();
