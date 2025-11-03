const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, verifyToken } = require('../utils/jwt');

const {
  findStaffByEmployeeId,
  getStaffById,
  updateStaff,
  getStaffAssignments,
  createStaffTask,
  getStaffTasks,
  updateTaskStatus,
  getStaffPerformance,
  updateStaffPassword
} = require('../models/Staff');

// Staff Login
router.post('/login', async (req, res) => {
  console.log('🚨 STAFF LOGIN ROUTE CALLED - This should appear in logs!');
  const { employeeId, password } = req.body;

  try {
    const staff = await findStaffByEmployeeId(employeeId);

    if (!staff) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    // Check if password exists and compare
    if (!staff.password || !await bcrypt.compare(password, staff.password)) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    if (!staff.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Set session data
    req.session.staff = {
      id: staff.id,
      name: staff.name,
      employeeId: staff.employee_id,
      email: staff.email,
      position: staff.position,
      department: staff.department
    };
    
    console.log('🔐 Session data set:', req.session.staff);
    console.log('🔐 Session ID:', req.sessionID);

    // Determine redirect URL based on position
    let redirectUrl = '/staff/dashboard'; // Default dashboard
    console.log(`🔍 Staff login debug - Position: "${staff.position}"`);
    switch (staff.position) {
      case 'Supervisor':
        redirectUrl = '/lead-technician/dashboard';
        console.log('✅ Redirecting to Supervisor dashboard');
        break;
      case 'Admin Assistant':
        redirectUrl = '/admin-assistant/dashboard';
        console.log('✅ Redirecting to Admin Assistant dashboard');
        break;
      case 'Customer Care':
        redirectUrl = '/customer-care/dashboard';
        console.log('✅ Redirecting to Customer Care dashboard');
        break;
      default:
        redirectUrl = '/staff/dashboard'; // General staff dashboard
        console.log(`⚠️ Unknown position "${staff.position}", redirecting to general dashboard`);
        break;
    }
    console.log(`🎯 Final redirect URL: ${redirectUrl}`);
    res.json({ 
      success: true, 
      message: "Login successful",
      redirectUrl: redirectUrl,
      position: staff.position
    });
  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Staff Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error destroying staff session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Middleware to check staff authentication
function requireStaffAuth(req, res, next) {
  if (req.session && req.session.staff) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Staff not authenticated' });
}

// Get Staff Profile
router.get('/profile', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;

  try {
    const staff = await getStaffById(staffId);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Remove password from response
    const { password, ...staffData } = staff;
    res.json(staffData);
  } catch (err) {
    console.error('Staff profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Staff Dashboard Data
router.get('/dashboard-data', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;

  try {
    // Get assigned customers count
    const assignedCustomers = await getStaffAssignments(staffId);

    // Get open tickets/tasks
    const pendingTasks = await getStaffTasks(staffId, 'pending');
    const inProgressTasks = await getStaffTasks(staffId, 'in_progress');

    // Get performance data for current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const performance = await getStaffPerformance(staffId, startOfMonth, endOfMonth);

    const dashboardData = {
      assignedCustomers: assignedCustomers.length,
      openTickets: pendingTasks.length + inProgressTasks.length,
      tasksCompleted: performance.completed_tasks,
      performanceScore: performance.total_tasks > 0 ?
        Math.round((performance.completed_tasks / performance.total_tasks) * 100) + '%' : '0%'
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Staff dashboard data fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Staff Assignments (Customers)
router.get('/customers', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;

  try {
    const customers = await getStaffAssignments(staffId);
    res.json(customers);
  } catch (err) {
    console.error('Staff assignments fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned customers' });
  }
});

// Get Staff Tasks
router.get('/tasks', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { status } = req.query;

  try {
    const tasks = await getStaffTasks(staffId, status);
    res.json(tasks);
  } catch (err) {
    console.error('Staff tasks fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create New Task
router.post('/tasks', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { type, customer, description, time } = req.body;

  if (!type || !customer || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find client by name (in a real app, you'd use client ID)
    const [clientRows] = await db.execute('SELECT id FROM clients WHERE name LIKE ?', [`%${customer}%`]);
    const clientId = clientRows.length > 0 ? clientRows[0].id : null;

    const taskId = await createStaffTask({
      staff_id: staffId,
      client_id: clientId,
      task_type: type,
      description: description,
      scheduled_time: time || new Date(),
      priority: 'medium',
      status: 'pending'
    });

    res.json({ success: true, message: 'Task created successfully', taskId });
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Complete Task
router.post('/tasks/:taskId/complete', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { taskId } = req.params;

  try {
    // Verify the task belongs to this staff member
    const [taskRows] = await db.execute('SELECT * FROM staff_tasks WHERE id = ? AND staff_id = ?', [taskId, staffId]);

    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const success = await updateTaskStatus(taskId, 'completed', staffId);

    if (success) {
      res.json({ success: true, message: 'Task completed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to complete task' });
    }
  } catch (err) {
    console.error('Task completion error:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Update Staff Profile
router.put('/profile', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const success = await updateStaff(staffId, { name, email, phone });

    if (success) {
      // Update session data
      req.session.staff.name = name;
      req.session.staff.email = email;

      res.json({ success: true, message: 'Profile updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (err) {
    console.error('Staff profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Change Password
router.put('/change-password', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing password fields' });
  }

  try {
    const staff = await getStaffById(staffId);

    if (!staff || !staff.password) {
      return res.status(404).json({ message: 'Staff member not found or password not set' });
    }

    const isMatch = await bcrypt.compare(currentPassword, staff.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await updateStaffPassword(staffId, hashedNewPassword);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Staff password change error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Get Performance Report
router.get('/performance', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { startDate, endDate } = req.query;

  try {
    const performance = await getStaffPerformance(staffId, startDate, endDate);
    res.json(performance);
  } catch (err) {
    console.error('Performance fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Create Support Ticket (for clients)
router.post('/support-ticket', requireStaffAuth, async (req, res) => {
  const staffId = req.session.staff.id;
  const { customer, issue, priority, description } = req.body;

  if (!customer || !issue || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find client by name
    const [clientRows] = await db.execute('SELECT id FROM clients WHERE name LIKE ?', [`%${customer}%`]);
    const clientId = clientRows.length > 0 ? clientRows[0].id : null;

    // Create as a task for now (in a real system, you might have a separate tickets table)
    const taskId = await createStaffTask({
      staff_id: staffId,
      client_id: clientId,
      task_type: 'Support Ticket',
      description: `${issue}: ${description}`,
      scheduled_time: new Date(),
      priority: priority.toLowerCase(),
      status: 'pending'
    });

    res.json({ success: true, message: 'Support ticket created successfully', taskId });
  } catch (err) {
    console.error('Support ticket creation error:', err);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

module.exports = router;