const db = require("../config/db");

const Renewals = {
  create: async (data) => {
    const query = `
      INSERT INTO renewals 
        (subscription_id, user_id, package_id, old_package_id,
         amount, old_amount, old_expiry_date, new_expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.subscription_id,
      data.user_id,
      data.package_id,
      data.old_package_id,
      data.amount,
      data.old_amount,
      data.old_expiry_date,
      data.new_expiry_date,
    ];

    return db.query(query, values);
  },

  // Get last renewal for a subscription
  getLastBySubscriptionId: async (subscriptionId) => {
    const [rows] = await db.query(
      `SELECT * FROM renewals WHERE subscription_id=? ORDER BY renewal_date DESC LIMIT 1`,
      [subscriptionId]
    );
    return rows[0];
  },

  // Delete renewal by ID
  deleteById: async (id) => {
    const [result] = await db.query(`DELETE FROM renewals WHERE id=?`, [id]);
    return result;
  },

  // Get renewal by ID
  getById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM renewals WHERE id=?`, [id]);
    return rows[0];
  },

  getMonthlyStats: async (year, month) => {
    const [rows] = await db.query(
      `
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(amount + COALESCE(old_amount, 0)), 0) as revenue,
      COALESCE(AVG(amount + COALESCE(old_amount, 0)), 0) as avg_amount
    FROM renewals
    WHERE YEAR(renewal_date) = ? 
      AND MONTH(renewal_date) = ?
      AND is_deleted = FALSE
    `,
      [year, month]
    );
    return rows[0] || { count: 0, revenue: 0, avg_amount: 0 };
  },
};

module.exports = Renewals;
