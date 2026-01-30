const db = require("../config/db");

const ClientsOnboard = {
  // Create
  create: async (data, staffId) => {
    const { email, first_name, second_name, phone, location, package_id } = data;
    const sql = `INSERT INTO client_onboard (email, first_name, second_name, phone, location, package_id, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [email, first_name, second_name, phone, location, package_id, staffId]);
    return result;
  },

  // Get only clients belonging to the logged-in staff
  getByStaff: async (staffId) => {
    const [rows] = await db.query(`
      SELECT 
        co.*, 
        p.name AS package_name,
        oc.amount AS commission_amount,
        oc.status AS commission_status
      FROM client_onboard co
      LEFT JOIN packages p ON co.package_id = p.id
      LEFT JOIN onboard_commissions oc ON co.id = oc.onboard_id
      WHERE co.staff_id = ?
      ORDER BY co.created_at DESC
    `, [staffId]);
    return rows;
  },

  // Read All
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT
      co.*,
      s.first_name AS staff_first_name,
      s.second_name AS staff_second_name
      FROM client_onboard co
      JOIN staff s ON co.staff_id = s.id
      ORDER BY co.created_at DESC
    `);
    return rows;
  },

  // Read One
  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM client_onboard WHERE id = ?", [id]);
    return rows[0];
  },

  // Update
  update: async (id, data) => {
    const { email, first_name, second_name, phone, location, package_id, is_active } = data;
    const sql = `UPDATE client_onboard SET email=?, first_name=?, second_name=?, phone=?, location=?, package_id=?, WHERE id=?`;
    const [result] = await db.execute(sql, [email, first_name, second_name, phone, location, package_id, id]);
    return result;
  },

  // Update status
  updateStatus: async (id, status) => {
    const [result] = await db.execute(
      "UPDATE client_onboard SET status = ? WHERE id = ?", 
      [status, id]
    );
    return result;
  },

  // Delete
  delete: async (id) => {
    const [result] = await db.query("DELETE FROM client_onboard WHERE id = ?", [id]);
    return result;
  },

  // Onboard commissions management

  // Award a commission
  create: async (onboard_id, staff_id, amount) => {
    const sql = `INSERT INTO onboard_commissions (onboard_id, staff_id, amount) VALUES (?, ?, ?)`;
    const [result] = await db.execute(sql, [onboard_id, staff_id, amount]);
    return result;
  },

  // Get all commissions with Staff and Client names
  getAllWithDetails: async () => {
    const sql = `
      SELECT oc.*, 
             s.first_name as staff_fname, s.second_name as staff_sname,
             c.first_name as client_fname, c.second_name as client_sname
      FROM onboard_commissions oc
      JOIN staff s ON oc.staff_id = s.id
      JOIN client_onboard c ON oc.onboard_id = c.id
      ORDER BY oc.awarded_at DESC`;
    const [rows] = await db.query(sql);
    return rows;
  },

  // Update payment status
  updatePaymentStatus: async (id, status) => {
    const [result] = await db.execute(
      "UPDATE onboard_commissions SET status = ? WHERE id = ?",
      [status, id]
    );
    return result;
  },

  // Summary of earnings per staff
  getStaffEarnings: async () => {
    const sql = `
      SELECT s.first_name, s.second_name, 
             SUM(CASE WHEN oc.status = 'unpaid' THEN amount ELSE 0 END) as pending_payout,
             SUM(CASE WHEN oc.status = 'paid' THEN amount ELSE 0 END) as total_paid
      FROM staff s
      JOIN onboard_commissions oc ON s.id = oc.staff_id
      GROUP BY s.id`;
    const [rows] = await db.query(sql);
    return rows;
  },

  awardCommission: async (onboard_id, staff_id, amount) => {
    const sql = `INSERT INTO onboard_commissions (onboard_id, staff_id, amount) VALUES (?, ?, ?)`;
    const [result] = await db.execute(sql, [onboard_id, staff_id, amount]);
    return result;
  },

  getClientWithStaff: async (id) => {
    const sql = `
      SELECT c.*, s.first_name as staff_fname, s.second_name as staff_sname
      FROM client_onboard c
      JOIN staff s ON c.staff_id = s.id
      WHERE c.id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  },
};

module.exports = ClientsOnboard;