const db = require("../config/db");

async function createStaffPayslipsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_payslips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL, 
      salary_id INT NOT NULL,
      pay_period VARCHAR(20) NOT NULL, 
      allowances TEXT,
      allowance_description TEXT NULL,
      gross_pay DECIMAL(10,2) NOT NULL,
      deductions TEXT,
      deduction_description TEXT NULL,
      net_pay DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'bank',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (salary_id) REFERENCES staff_salaries(id) ON DELETE CASCADE
    );
  `);
  console.log("Staff Payslips table created");
}

module.exports = createStaffPayslipsTable;
