const db = require("../config/db");
const dayjs = require("dayjs");

const UserSubscription = {
  // Create a new subscription record
  create: async (
    userId,
    packageId,
    startDate,
    expiryDate,
    paymentAmount = null,
    status = "active"
  ) => {
    const [result] = await db.query(
      `INSERT INTO user_subscriptions (user_id, package_id, start_date, expiry_date, status, payment_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, packageId, startDate, expiryDate, status, paymentAmount]
    );
    return result;
  },

  // Get current active subscription for a user
  getCurrent: async (userId) => {
    const [rows] = await db.query(
      `
    SELECT 
      us.*,
      p.name AS package_name,
      p.price,
      p.validity_days,

      pay.amount AS payment_amount,
      pay.transaction_id,
      pay.payment_method,
      pay.status,
      pay.payment_date

    FROM user_subscriptions us
    LEFT JOIN packages p 
      ON us.package_id = p.id

    LEFT JOIN payments pay 
      ON pay.user_id = us.user_id
     AND pay.package_id = us.package_id

    WHERE us.user_id = ?

    ORDER BY us.id DESC
    LIMIT 1
    `,
      [userId]
    );

    return rows[0];
  },

  // Renew a subscription (extend expiry date)
  renew: async (subscriptionId, additionalDays) => {
    const [result] = await db.query(
      `UPDATE user_subscriptions
       SET expiry_date = DATE_ADD(expiry_date, INTERVAL ? DAY)
       WHERE id=?`,
      [additionalDays, subscriptionId]
    );
    return result;
  },

  // Upgrade subscription: create a new subscription record for user
  upgrade: async (
    userId,
    newPackageId,
    startDate,
    expiryDate,
    paymentAmount = null
  ) => {
    // Mark previous subscriptions as expired (FIXED SYNTAX ERROR HERE)
    await db.query(
      `UPDATE user_subscriptions SET status='expired' WHERE user_id=? AND status='active'`,
      [userId]
    );

    // Create new subscription
    return await UserSubscription.create(
      userId,
      newPackageId,
      startDate,
      expiryDate,
      paymentAmount,
      "active"
    );
  },

  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k}=?`)
      .join(", ");
    const values = Object.values(data);
    values.push(id);

    const [result] = await db.query(
      `UPDATE user_subscriptions SET ${fields} WHERE id=?`,
      values
    );
    return result;
  },

  // Get all subscriptions for a user (history)
  getRenewalHistory: async (userId) => {
    const [rows] = await db.query(
      `
    SELECT 
      r.id,
      r.subscription_id,
      r.user_id,
      r.package_id,
      p.name AS package_name,
      p.price AS package_price,
      p.validity_days,
      r.old_package_id,
      op.name AS old_package_name,
      r.amount,
      r.old_amount,
      r.renewal_date,
      r.old_expiry_date,
      r.new_expiry_date,
      r.is_deleted
    FROM renewals r
    LEFT JOIN packages p ON r.package_id = p.id
    LEFT JOIN packages op ON r.old_package_id = op.id
    WHERE r.user_id = ?
    ORDER BY r.renewal_date DESC
    `,
      [userId]
    );

    return rows;
  },

  // Get subscription by ID
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM user_subscriptions WHERE id=?`,
      [id]
    );
    return rows[0];
  },

  // Delete subscription by ID
  deleteById: async (id) => {
    // Delete related renewals first
    await db.query(`DELETE FROM renewals WHERE subscription_id=?`, [id]);
    const [result] = await db.query(
      `DELETE FROM user_subscriptions WHERE id=?`,
      [id]
    );
    return result;
  },
  deleteRenewalById: async (id) => {
    const [result] = await db.query(`DELETE FROM renewals WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = UserSubscription;
