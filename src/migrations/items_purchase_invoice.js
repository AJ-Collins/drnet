const db = require("../config/db");

async function createPurchaseInvoiceTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS one_time_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(20) NOT NULL UNIQUE,
      client_purchase_id INT NOT NULL,
      payment_id INT NULL,
      invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      vat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (client_purchase_id) REFERENCES client_item_purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES client_item_payments(id) ON DELETE SET NULL
    );
  `);
  console.log("One-Time Invoices table created");
}

async function createItemsPurchaseInvoiceTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS one_time_invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      description VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES one_time_invoices(id) ON DELETE CASCADE
    );
  `);
  console.log("One-Time Invoice Items table created");
}

module.exports = {
  createPurchaseInvoiceTable,
  createItemsPurchaseInvoiceTable,
};
