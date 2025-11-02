const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'drnet_db'
};

// Only add password if it exists and is not empty
if (process.env.DB_PASS && process.env.DB_PASS.trim() !== '') {
  config.password = process.env.DB_PASS;
}

const pool = mysql.createPool(config);

module.exports = pool;
