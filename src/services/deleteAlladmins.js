const db = require('../config/db');
require('dotenv').config();

(async () => {
  try {
    const [result] = await db.execute("DELETE FROM admins");
    console.log(`🗑️ Deleted ${result.affectedRows} admin(s)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error deleting admins:', err);
    process.exit(1);
  }
})();
