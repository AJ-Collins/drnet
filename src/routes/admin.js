const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, verifyToken } = require('../utils/jwt');

const {
  findAdminByUsername,
  createAdmin,
  deleteAllAdmins
} = require('../models/Admin');

const {
  getAllClients,
  getDeletedClients,
  softDeleteClient,
  recoverClient,
  permanentDeleteClient
} = require('../models/Client');

// Temporarily commenting out Staff imports to debug
// const {
//   createStaff,
//   findStaffByEmployeeId,
//   findStaffByEmail,
//   getAllStaff,
//   deactivateStaff,
//   activateStaff
// } = require('../models/Staff');

// ✅ CTIO (SysAdmin) Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // ✅ Set session data
    req.session.admin = {
      id: admin.id,
      username: admin.username
    };

    res.json({ success: true, message: "Login successful" }); // optional token can also be sent
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CTIO (SysAdmin) Notifications Endpoint
router.post('/notifications', async (req, res) => {
  try {
    const { message, type, from, timestamp } = req.body;
    
    // For now, just log the notification - can be stored in database later
    console.log(`📢 CTIO NOTIFICATION [${type}] from ${from}: ${message} at ${timestamp}`);
    
    // Here you could store in database, send email, etc.
    // await db.execute('INSERT INTO notifications (message, type, from_user, timestamp) VALUES (?, ?, ?, ?)', 
    //   [message, type, from, timestamp]);
    
    res.json({ success: true, message: 'Notification sent to CTIO (SysAdmin)' });
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error destroying session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid'); // Clear session cookie
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// ✅ Create Default CTIO (SysAdmin)
router.get('/create-default', async (req, res) => {
  try {
    const existing = await findAdminByUsername('drnet');
    if (existing) return res.status(400).json({ message: 'CTIO (SysAdmin) already exists' });

    const hashed = await bcrypt.hash('Janam@2030', 10);
    await createAdmin('drnet', hashed);

    // console.log('✅ Default admin created (username: drnet)');
    res.json({ message: '✅ New CTIO (SysAdmin) created' });
  } catch (err) {
    console.error('❌ Failed to create CTIO (SysAdmin):', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', async (req, res) => {
  const { name, title, email, phone, image } = req.body;

  if (!name || !email || !phone ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await db.execute(`
      UPDATE admins SET
        name = ?, title = ?, email = ?, phone = ?, image = ?
      WHERE username = ?
    `, [name, title, email, phone, image || null, 'drnet' ]);

    res.status(200).json({ message: '✅ CTIO (SysAdmin) profile updated' });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update Admin Profile Picture Only
router.put('/profile/image', async (req, res) => {
  const { image } = req.body;
  try {
    await db.execute(`UPDATE admins SET image = ? WHERE username = ?`, [image, 'drnet']);
    res.status(200).json({ message: '✅ Profile picture updated' });
  } catch (err) {
    console.error('❌ Error updating profile image:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Reset Admin Password
router.post('/reset-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing password fields' });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", ['drnet']);
    const admin = rows[0];

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE admins SET password = ? WHERE username = ?", [hashed, 'drnet']);

    res.status(200).json({ message: '✅ Password updated successfully' });
  } catch (err) {
    console.error('❌ Password reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', async (req, res) => {
  const adminId = req.session?.admin?.id;

  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized: Admin not authenticated' });
  }

  try {
    const [rows] = await db.query(
      'SELECT name, title, image FROM admins WHERE id = ?',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Client Management Routes

// Get all active clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get deleted clients
router.get('/clients/deleted', async (req, res) => {
  try {
    const deletedClients = await getDeletedClients();
    res.json(deletedClients);
  } catch (err) {
    console.error('Error fetching deleted clients:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft delete client
router.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await softDeleteClient(id);
    if (success) {
      res.json({ success: true, message: 'Client moved to deleted users' });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Recover deleted client
router.post('/clients/:id/recover', async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await recoverClient(id);
    if (success) {
      res.json({ success: true, message: 'Client recovered successfully' });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (err) {
    console.error('Error recovering client:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Permanently delete client
router.delete('/clients/:id/permanent', async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await permanentDeleteClient(id);
    if (success) {
      res.json({ success: true, message: 'Client permanently deleted' });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (err) {
    console.error('Error permanently deleting client:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get All Staff Members (Admin only) - TEMPORARILY DISABLED
// router.get('/staff', async (req, res) => {
//   try {
//     const staff = await getAllStaff();
//     res.json(staff);
//   } catch (err) {
//     console.error('Error fetching staff:', err);
//     res.status(500).json({ error: 'Server error occurred while fetching staff members' });
//   }
// });

/*
// ✅ Create Staff Member (Admin only) - TEMPORARILY DISABLED
router.post('/staff', async (req, res) => {
  try {
    const {
      name, email, phone, employee_id, position, department,
      salary, password, isActive, hire_date, contractDuration
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !employee_id || !position || !department || !salary || !password || !hire_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if employee ID already exists
    const existingStaffById = await findStaffByEmployeeId(employee_id);
    if (existingStaffById) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Check if email already exists
    const existingStaffByEmail = await findStaffByEmail(email);
    if (existingStaffByEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate contract end date if provided
    let contractEndDate = null;
    if (contractDuration) {
      const hireDate = new Date(hire_date);
      contractEndDate = new Date(hireDate);
      contractEndDate.setMonth(contractEndDate.getMonth() + parseInt(contractDuration));
    }

    // Create staff member
    const staffData = {
      name,
      email,
      phone,
      employee_id,
      position,
      department,
      salary: parseFloat(salary),
      password: hashedPassword,
      isActive: isActive !== false, // Default to true
      hire_date,
      contract_end_date: contractEndDate
    };

    const staffId = await createStaff(staffData);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staffId: staffId
    });

  } catch (err) {
    console.error('Error creating staff:', err);
    res.status(500).json({ error: 'Server error occurred while creating staff member' });
  }
});

// ✅ Toggle Staff Status (Admin only)
router.put('/staff/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    let success;
    if (isActive) {
      success = await activateStaff(id);
    } else {
      success = await deactivateStaff(id);
    }

    if (success) {
      res.json({ 
        success: true, 
        message: `Staff ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } else {
      res.status(404).json({ error: 'Staff member not found' });
    }
  } catch (err) {
    console.error('Error toggling staff status:', err);
    res.status(500).json({ error: 'Server error occurred while updating staff status' });
  }
});
*/

module.exports = router;
