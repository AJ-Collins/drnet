const db = require("../config/db");

async function createMonthlyAnalyticsTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS monthly_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year INT NOT NULL,
        month TINYINT NOT NULL,

        computed_subscription_revenue   DECIMAL(12,2) DEFAULT 0,
        adjustment_subscription_revenue DECIMAL(12,2) DEFAULT 0,

        computed_sales_revenue          DECIMAL(12,2) DEFAULT 0,
        adjustment_sales_revenue        DECIMAL(12,2) DEFAULT 0,

        computed_hrexpenses             DECIMAL(12,2) DEFAULT 0,
        adjustment_hrexpenses           DECIMAL(12,2) DEFAULT 0,

        computed_staff_salaries         DECIMAL(12,2) DEFAULT 0,
        adjustment_staff_salaries       DECIMAL(12,2) DEFAULT 0,

        computed_new_clients_count        INT DEFAULT 0,
        adjustment_new_clients_count      INT DEFAULT 0,

        computed_new_subscriptions_count  INT DEFAULT 0,
        adjustment_new_subscriptions_count INT DEFAULT 0,

        hotspot_revenue             DECIMAL(12,2) DEFAULT 0,
        hotspot_subscriptions_count INT DEFAULT 0,

        notes TEXT NULL,
        is_locked BOOLEAN DEFAULT FALSE,
        last_computed_at TIMESTAMP NULL,
        updated_by INT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY uq_year_month (year, month)
      );
    `);
    console.log("Monthly analytics table created");
}

module.exports = createMonthlyAnalyticsTable;
