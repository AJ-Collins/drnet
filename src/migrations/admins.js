const db = require('../config/db');

async function createAdminsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name VARCHAR(100) DEFAULT NULL,
      title VARCHAR(100) DEFAULT NULL,
      email VARCHAR(100) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      image MEDIUMTEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log('Admins table created');
}

module.exports = createAdminsTable;
