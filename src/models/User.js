const db = require('../config/db');

async function createUser(data) {
  const {
    name, package: pkg, location, phone,
    paymentDate, expiryDate, debt, routerPurchased,
    routerCost, subscriptionAmount, paidSubscription
  } = data;

  await db.execute(
    `INSERT INTO users (name, package, location, phone, payment_date, expiry_date, debt,
     router_purchased, router_cost, subscription_amount, paid_subscription)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, pkg, location, phone, paymentDate, expiryDate, debt,
      routerPurchased, routerCost, subscriptionAmount, paidSubscription
    ]
  );
}

async function getUserById(id) {
  const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0]; // Return the user object or undefined
}

async function updateUser(id, data) {
  const { name, phone, location, subscription_amount, paid_subscription } = data;

  const [result] = await db.execute(
    `UPDATE users SET name = ?, phone = ?, location = ?, subscription_amount = ?, paid_subscription = ? WHERE id = ?`,
    [name, phone, location, subscription_amount, paid_subscription, id]
  );

  return result.affectedRows > 0;
}

async function getAllUsers() {
  const [rows] = await db.execute("SELECT * FROM users ORDER BY created_at DESC");
  return rows;
}

async function softDeleteUser(id) {
  const [result] = await db.execute(
    `UPDATE users SET is_deleted = 1 WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function deleteUser(id) {
  const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function upgradeUserPackage(id, data) {
  const { package: pkg, subscription_amount, payment_date, expiry_date, paid_subscription } = data;

  const [result] = await db.execute(
    `UPDATE users SET package = ?, subscription_amount = ?, payment_date = ?, expiry_date = ?, paid_subscription = ? WHERE id = ?`,
    [pkg, subscription_amount, payment_date, expiry_date, paid_subscription, id]
  );

  return result.affectedRows > 0;
}


module.exports = { createUser, getAllUsers, updateUser, getUserById, softDeleteUser, deleteUser, upgradeUserPackage };
