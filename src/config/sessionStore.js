/**
 * MySQL-backed Session Store Configuration
 * 
 * Replaces the default Express MemoryStore which leaks memory in production.
 * Sessions are stored in the `sessions` table in the existing MySQL database.
 * Expired sessions are automatically cleaned up every 15 minutes.
 */
require("dotenv").config();
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const sessionStoreOptions = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "drnet",

  // Table & schema
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },

  // Cleanup expired sessions every 15 minutes
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,

  // Session lifetime: 24 hours (matches cookie maxAge)
  expiration: 24 * 60 * 60 * 1000,

  // Connection pool settings — keep small so it doesn't compete with app pool
  connectionLimit: 1,
  endConnectionOnClose: true,
};

const sessionStore = new MySQLStore(sessionStoreOptions);

/**
 * Returns configured session middleware using MySQL store.
 */
function createSessionMiddleware() {
  return session({
    key: "drnet.sid",
    secret:
      process.env.SESSION_SECRET || "drnet-session-secret-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  });
}

module.exports = { createSessionMiddleware, sessionStore };
