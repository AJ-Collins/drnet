const db = require('../config/db');

// Client model functions

async function createClient(data) {
  const {
    name, email, phone, address,
    packageType, monthlyFee, startDate,
    expiryDate, password, isActive = true
  } = data;

  const [result] = await db.execute(
    `INSERT INTO clients (name, email, phone, address, package_type, monthly_fee, 
     start_date, expiry_date, password, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      name, email, phone, address, packageType, monthlyFee,
      startDate, expiryDate, password, isActive
    ]
  );

  return result.insertId;
}

async function findClientByPhone(phone) {
  const [rows] = await db.execute('SELECT * FROM clients WHERE phone = ?', [phone]);
  return rows[0];
}

async function findClientByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM clients WHERE email = ?', [email]);
  return rows[0];
}

async function getClientById(id) {
  const [rows] = await db.execute("SELECT * FROM clients WHERE id = ?", [id]);
  return rows[0];
}

async function updateClient(id, data) {
  const { name, email, phone, address, package_type, monthly_fee } = data;

  const [result] = await db.execute(
    `UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, 
     package_type = ?, monthly_fee = ?, updated_at = NOW() WHERE id = ?`,
    [name, email, phone, address, package_type, monthly_fee, id]
  );

  return result.affectedRows > 0;
}

async function getAllClients() {
  const [rows] = await db.execute(
    "SELECT id, name, email, phone, package_type, monthly_fee, start_date, expiry_date, is_active, created_at FROM clients WHERE deleted_at IS NULL ORDER BY created_at DESC"
  );
  return rows;
}

async function getDeletedClients() {
  const [rows] = await db.execute(
    "SELECT id, name, email, phone, package_type, monthly_fee, start_date, expiry_date, is_active, created_at, deleted_at FROM clients WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  );
  return rows;
}

async function renewClientSubscription(id, data) {
  const { expiry_date, payment_date } = data;

  const [result] = await db.execute(
    `UPDATE clients SET expiry_date = ?, last_payment_date = ?, updated_at = NOW() WHERE id = ?`,
    [expiry_date, payment_date, id]
  );

  return result.affectedRows > 0;
}

async function deactivateClient(id) {
  const [result] = await db.execute(
    `UPDATE clients SET is_active = 0, updated_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function activateClient(id) {
  const [result] = await db.execute(
    `UPDATE clients SET is_active = 1, updated_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function updateClientPassword(id, hashedPassword) {
  const [result] = await db.execute(
    `UPDATE clients SET password = ?, updated_at = NOW() WHERE id = ?`,
    [hashedPassword, id]
  );
  return result.affectedRows > 0;
}

async function addClientPayment(clientId, amount, paymentMethod = 'cash') {
  const [result] = await db.execute(
    `INSERT INTO client_payments (client_id, amount, payment_method, payment_date, created_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [clientId, amount, paymentMethod]
  );
  return result.insertId;
}

async function getClientPayments(clientId) {
  const [rows] = await db.execute(
    `SELECT * FROM client_payments WHERE client_id = ? ORDER BY payment_date DESC`,
    [clientId]
  );
  return rows;
}

async function softDeleteClient(id) {
  const [result] = await db.execute(
    `UPDATE clients SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function recoverClient(id) {
  const [result] = await db.execute(
    `UPDATE clients SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function permanentDeleteClient(id) {
  const [result] = await db.execute(
    `DELETE FROM clients WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createClient,
  findClientByPhone,
  findClientByEmail,
  getClientById,
  updateClient,
  getAllClients,
  getDeletedClients,
  renewClientSubscription,
  deactivateClient,
  activateClient,
  updateClientPassword,
  addClientPayment,
  getClientPayments,
  softDeleteClient,
  recoverClient,
  permanentDeleteClient
};