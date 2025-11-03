const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, verifyToken } = require('../utils/jwt');

const {
  createClient,
  findClientByPhone,
  findClientByEmail,
  getClientById,
  updateClient,
  renewClientSubscription,
  addClientPayment,
  getClientPayments,
  updateClientPassword
} = require('../models/Client');

// Client Registration
router.post('/register', async (req, res) => {
  const { name, email, phone, address, packageType, monthlyFee } = req.body;

  // Validation
  if (!name || !email || !phone || !packageType || !monthlyFee) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if client already exists
    const existingClientPhone = await findClientByPhone(phone);
    if (existingClientPhone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const existingClientEmail = await findClientByEmail(email);
    if (existingClientEmail) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    // Generate temporary password (client will need to change it on first login)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Create client
    const clientId = await createClient({
      name,
      email,
      phone,
      address,
      packageType,
      monthlyFee: parseFloat(monthlyFee),
      startDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      password: hashedPassword,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      clientId,
      tempPassword, // In production, send this via SMS/Email
      loginInstructions: 'Please use your phone number and the temporary password to log in, then change your password.'
    });

  } catch (err) {
    console.error('Client registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Client Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const client = await findClientByPhone(phone);

    if (!client) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Check if password exists and compare
    if (!client.password || !await bcrypt.compare(password, client.password)) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    if (!client.is_active) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Set session data
    req.session.client = {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email
    };

    res.json({ success: true, message: "Login successful" });
  } catch (err) {
    console.error('Client login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Client Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error destroying client session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Middleware to check client authentication
function requireClientAuth(req, res, next) {
  if (req.session && req.session.client) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Client not authenticated' });
}

// Get Client Profile
router.get('/profile', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;

  try {
    const client = await getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Remove password from response
    const { password, ...clientData } = client;
    res.json(clientData);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Client Dashboard Data
router.get('/dashboard-data', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;

  try {
    const client = await getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Calculate next payment date (assuming monthly billing)
    const nextPaymentDate = new Date(client.expiry_date);
    const today = new Date();

    // Calculate outstanding balance (this would be more complex in a real system)
    let outstandingBalance = 0;
    if (nextPaymentDate < today) {
      const monthsOverdue = Math.floor((today - nextPaymentDate) / (30 * 24 * 60 * 60 * 1000));
      outstandingBalance = monthsOverdue * client.monthly_fee;
    }

    const dashboardData = {
      currentPlan: client.package_type,
      nextPayment: nextPaymentDate.toLocaleDateString(),
      accountStatus: client.is_active ? 'Active' : 'Inactive',
      outstandingBalance: outstandingBalance,
      packageName: client.package_type,
      monthlyCost: `$${client.monthly_fee}`,
      startDate: new Date(client.start_date).toLocaleDateString(),
      expiryDate: new Date(client.expiry_date).toLocaleDateString()
    };

    res.json(dashboardData);
  } catch (err) {
    console.error('Dashboard data fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Make Payment
router.post('/payment', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  try {
    // Add payment record
    const paymentId = await addClientPayment(clientId, amount, 'online');

    // Update client's last payment date
    await db.execute(
      `UPDATE clients SET last_payment_date = NOW(), updated_at = NOW() WHERE id = ?`,
      [clientId]
    );

    res.json({ success: true, message: 'Payment processed successfully', paymentId });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Renew Subscription
router.post('/renew', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;

  try {
    const client = await getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Calculate new expiry date (1 month from current expiry or today, whichever is later)
    const currentExpiry = new Date(client.expiry_date);
    const today = new Date();
    const startDate = currentExpiry > today ? currentExpiry : today;

    const newExpiry = new Date(startDate);
    newExpiry.setMonth(newExpiry.getMonth() + 1);

    // Update subscription
    const success = await renewClientSubscription(clientId, {
      expiry_date: newExpiry,
      payment_date: new Date()
    });

    if (success) {
      // Add payment record
      await addClientPayment(clientId, client.monthly_fee, 'renewal');
      res.json({ success: true, message: 'Subscription renewed successfully', newExpiryDate: newExpiry });
    } else {
      res.status(500).json({ error: 'Failed to renew subscription' });
    }
  } catch (err) {
    console.error('Renewal error:', err);
    res.status(500).json({ error: 'Subscription renewal failed' });
  }
});

// Get Payment History
router.get('/payments', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;

  try {
    const payments = await getClientPayments(clientId);
    res.json(payments);
  } catch (err) {
    console.error('Payment history fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Update Profile
router.put('/profile', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const success = await updateClient(clientId, { name, email, phone, address });

    if (success) {
      // Update session data
      req.session.client.name = name;
      req.session.client.email = email;
      req.session.client.phone = phone;

      res.json({ success: true, message: 'Profile updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Change Password
router.put('/change-password', requireClientAuth, async (req, res) => {
  const clientId = req.session.client.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing password fields' });
  }

  try {
    const client = await getClientById(clientId);

    if (!client || !client.password) {
      return res.status(404).json({ message: 'Client not found or password not set' });
    }

    const isMatch = await bcrypt.compare(currentPassword, client.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await updateClientPassword(clientId, hashedNewPassword);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;