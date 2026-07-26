const db = require("../config/db");

async function addRevenueInjectionColumn() {
    // Safely add the column only if it doesn't already exist
    const [columns] = await db.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'monthly_analytics'
          AND COLUMN_NAME  = 'revenue_injection'
    `);

    if (columns.length > 0) {
        console.log("Column 'revenue_injection' already exists in monthly_analytics — skipping.");
        return;
    }

    await db.query(`
        ALTER TABLE monthly_analytics
        ADD COLUMN revenue_injection DECIMAL(12,2) DEFAULT 0
            AFTER hotspot_subscriptions_count
    `);

    console.log("Column 'revenue_injection' added to monthly_analytics.");
}

module.exports = addRevenueInjectionColumn;
