const db = require("../config/db");

async function createExpensesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(255) DEFAULT 'general',
      vendor VARCHAR(255) NULL,
      description TEXT NULL,
      amount DECIMAL(10,2) NOT NULL,
      expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Expenses table created");
}

module.exports = createExpensesTable;
