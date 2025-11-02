const db = require('./db');

async function runMigrations() {
  console.log('📦 Running MySQL migrations...');

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      phone VARCHAR(50),
      email VARCHAR(100),
      location VARCHAR(255),
      exact_location VARCHAR(255),
      package VARCHAR(100),
      extra_notes TEXT,
      installation_date DATE,
      status VARCHAR(50) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      package VARCHAR(100),
      location VARCHAR(255),
      phone VARCHAR(50),
      payment_date VARCHAR(50),
      expiry_date VARCHAR(50),
      debt DECIMAL(10,2),
      router_purchased BOOLEAN,
      router_cost DECIMAL(10,2),
      subscription_amount DECIMAL(10,2),
      paid_subscription BOOLEAN,
      last_renewal_date DATE,
      is_deleted BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS renewals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(100),
      amount DECIMAL(10,2),
      renewal_date DATE,
      expiry_date DATE,
      month VARCHAR(20),
      year INT,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20) NOT NULL UNIQUE,
      address TEXT,
      package_type VARCHAR(100) DEFAULT 'Basic',
      monthly_fee DECIMAL(10,2) DEFAULT 29.99,
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      password TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      last_payment_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      employee_id VARCHAR(50) NOT NULL UNIQUE,
      position VARCHAR(100) DEFAULT 'Staff Member',
      department VARCHAR(100) DEFAULT 'Technical',
      salary DECIMAL(10,2),
      password TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      hire_date DATE,
      contract_end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff_client_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      client_id INT NOT NULL,
      assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_assignment (staff_id, client_id),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      client_id INT,
      task_type VARCHAR(100) NOT NULL,
      description TEXT,
      scheduled_time TIMESTAMP,
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
      completed_date TIMESTAMP NULL,
      completed_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (completed_by) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);

  console.log('✅ MySQL migrations completed.');
}

module.exports = runMigrations;
