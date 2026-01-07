const db = require("../config/db");

async function createHrExpensesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hrexpenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(255) NOT NULL,
      beneficiary VARCHAR(255) DEFAULT 'None',
      description TEXT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      expense_date DATE NOT NULL,
      status ENUM('pending', 'completed', 'suspended') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log("Hr Expenses table created");
}

module.exports = createHrExpensesTable;
