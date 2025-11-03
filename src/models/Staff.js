const db = require('../config/db');

// Staff model functions

async function createStaff(data) {
  const {
    name, email, phone, employee_id,
    position, department, salary,
    password, isActive = true, hire_date, contract_end_date
  } = data;

  const [result] = await db.execute(
    `INSERT INTO staff (name, email, phone, employee_id, position, department, 
     salary, password, is_active, hire_date, contract_end_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      name, email, phone, employee_id, position, department,
      salary, password, isActive, hire_date, contract_end_date
    ]
  );

  return result.insertId;
}

async function findStaffByEmployeeId(employeeId) {
  const [rows] = await db.execute('SELECT * FROM staff WHERE employee_id = ?', [employeeId]);
  return rows[0];
}

async function findStaffByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM staff WHERE email = ?', [email]);
  return rows[0];
}

async function getStaffById(id) {
  const [rows] = await db.execute("SELECT * FROM staff WHERE id = ?", [id]);
  return rows[0];
}

async function updateStaff(id, data) {
  const { name, email, phone, position, department, salary } = data;

  const [result] = await db.execute(
    `UPDATE staff SET name = ?, email = ?, phone = ?, position = ?, 
     department = ?, salary = ?, updated_at = NOW() WHERE id = ?`,
    [name, email, phone, position, department, salary, id]
  );

  return result.affectedRows > 0;
}

async function getAllStaff() {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, employee_id, position, department, 
     salary, is_active, hire_date, created_at FROM staff ORDER BY created_at DESC`
  );
  return rows;
}

async function getActiveStaff() {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, employee_id, position, department 
     FROM staff WHERE is_active = 1 ORDER BY name ASC`
  );
  return rows;
}

async function deactivateStaff(id) {
  const [result] = await db.execute(
    `UPDATE staff SET is_active = 0, updated_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function activateStaff(id) {
  const [result] = await db.execute(
    `UPDATE staff SET is_active = 1, updated_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function updateStaffPassword(id, hashedPassword) {
  const [result] = await db.execute(
    `UPDATE staff SET password = ?, updated_at = NOW() WHERE id = ?`,
    [hashedPassword, id]
  );
  return result.affectedRows > 0;
}

// Staff assignment functions
async function assignClientToStaff(staffId, clientId) {
  const [result] = await db.execute(
    `INSERT INTO staff_client_assignments (staff_id, client_id, assigned_date, created_at)
     VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE assigned_date = NOW()`,
    [staffId, clientId]
  );
  return result.affectedRows > 0;
}

async function getStaffAssignments(staffId) {
  const [rows] = await db.execute(
    `SELECT c.*, sca.assigned_date 
     FROM clients c 
     INNER JOIN staff_client_assignments sca ON c.id = sca.client_id 
     WHERE sca.staff_id = ? AND c.is_active = 1
     ORDER BY sca.assigned_date DESC`,
    [staffId]
  );
  return rows;
}

async function removeClientFromStaff(staffId, clientId) {
  const [result] = await db.execute(
    `DELETE FROM staff_client_assignments WHERE staff_id = ? AND client_id = ?`,
    [staffId, clientId]
  );
  return result.affectedRows > 0;
}

// Staff task functions
async function createStaffTask(data) {
  const {
    staff_id, client_id, task_type, description,
    scheduled_time, priority = 'medium', status = 'pending'
  } = data;

  const [result] = await db.execute(
    `INSERT INTO staff_tasks (staff_id, client_id, task_type, description, 
     scheduled_time, priority, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [staff_id, client_id, task_type, description, scheduled_time, priority, status]
  );

  return result.insertId;
}

async function getStaffTasks(staffId, status = null) {
  let query = `
    SELECT st.*, c.name as client_name, c.phone as client_phone, c.address as client_address
    FROM staff_tasks st
    LEFT JOIN clients c ON st.client_id = c.id
    WHERE st.staff_id = ?
  `;

  const params = [staffId];

  if (status) {
    query += ` AND st.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY st.scheduled_time ASC`;

  const [rows] = await db.execute(query, params);
  return rows;
}

async function updateTaskStatus(taskId, status, completedBy = null) {
  let query = `UPDATE staff_tasks SET status = ?, updated_at = NOW()`;
  const params = [status];

  if (status === 'completed' && completedBy) {
    query += `, completed_date = NOW(), completed_by = ?`;
    params.push(completedBy);
  }

  query += ` WHERE id = ?`;
  params.push(taskId);

  const [result] = await db.execute(query, params);
  return result.affectedRows > 0;
}

// Staff performance tracking
async function getStaffPerformance(staffId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(*) as total_tasks
    FROM staff_tasks 
    WHERE staff_id = ?
  `;

  const params = [staffId];

  if (startDate && endDate) {
    query += ` AND created_at BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  const [rows] = await db.execute(query, params);
  return rows[0] || { completed_tasks: 0, pending_tasks: 0, in_progress_tasks: 0, total_tasks: 0 };
}

module.exports = {
  createStaff,
  findStaffByEmployeeId,
  findStaffByEmail,
  getStaffById,
  updateStaff,
  getAllStaff,
  getActiveStaff,
  deactivateStaff,
  activateStaff,
  updateStaffPassword,
  assignClientToStaff,
  getStaffAssignments,
  removeClientFromStaff,
  createStaffTask,
  getStaffTasks,
  updateTaskStatus,
  getStaffPerformance
};