require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "drnet",
  connectionLimit: 10,
  dateStrings: true,
  timezone: '+00:00',
  multipleStatements: true,
  waitForConnections: true,
  queueLimit: 0
});

// Warm up pool on startup
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('MySQL pool warmed up');
        conn.release();
    } catch (err) {
        console.error('MySQL warmup failed:', err.message);
    }
})();

module.exports = pool;