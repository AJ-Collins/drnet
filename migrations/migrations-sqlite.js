const db = require('./db');

async function runMigrations() {
  console.log('📦 Running SQLite migrations...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT DEFAULT NULL,
      title TEXT DEFAULT NULL,
      email TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      location TEXT,
      exact_location TEXT,
      package TEXT,
      extra_notes TEXT,
      installation_date DATE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      package TEXT,
      location TEXT,
      phone TEXT,
      payment_date TEXT,
      expiry_date TEXT,
      debt REAL,
      router_purchased INTEGER,
      router_cost REAL,
      subscription_amount REAL,
      paid_subscription INTEGER,
      last_renewal_date DATE,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      amount REAL,
      renewal_date DATE,
      expiry_date DATE,
      month TEXT,
      year INTEGER,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL UNIQUE,
      address TEXT,
      package_type TEXT DEFAULT 'Basic',
      monthly_fee REAL DEFAULT 29.99,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      password TEXT,
      is_active INTEGER DEFAULT 1,
      last_payment_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      employee_id TEXT NOT NULL UNIQUE,
      position TEXT DEFAULT 'Staff Member',
      department TEXT DEFAULT 'Technical',
      salary REAL,
      password TEXT,
      is_active INTEGER DEFAULT 1,
      hire_date DATE,
      contract_end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff_client_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_assignment 
    ON staff_client_assignments(staff_id, client_id);
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      client_id INTEGER,
      task_type TEXT NOT NULL,
      description TEXT,
      scheduled_time DATETIME,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      completed_date DATETIME NULL,
      completed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ SQLite migrations completed.');
}

module.exports = runMigrations;