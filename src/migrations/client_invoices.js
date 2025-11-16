const db = require("../config/db");

async function createInvoicesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(100) NULL,
      invoice_date TIMESTAMP NULL,
      due_date TIMESTAMP NULL,
      billing_period VARCHAR(100) NULL,
      location VARCHAR(255) NULL,
      phone VARCHAR(20) NULL,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      vat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Invoices table created");
}

async function createInvoiceItemsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      description VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);
  console.log("Invoice Items table created");
}

module.exports = {
  createInvoicesTable,
  createInvoiceItemsTable,
};
