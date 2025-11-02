const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  softDeleteUser,
  upgradeUserPackage
} = require('../models/User');

// Create User
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.phone || !data.paymentDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('📥 Registering user:', data);

    // Default values
    data.debt = 0;
    data.routerPurchased = data.routerCost > 0;

    await createUser(data);

    res.status(201).json({ message: '✅ User created successfully' });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Read All
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Read One
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const requiredFields = [
      'name',
      'phone',
      'location',
      'package',
      'subscription_amount',
      'router_cost',
      'paid_subscription',
      'payment_date',
      'expiry_date'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const updated = await updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: '✅ User updated' });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: '🗑️ User deleted' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if ('isDeleted' in req.body) {
      const success = await softDeleteUser(req.params.id);
      if (!success) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: '🗑️ User soft-deleted' });
    }
    res.status(400).json({ message: 'Invalid PATCH request' });
  } catch (err) {
    console.error('❌ Error soft-deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/package/:id', async (req, res) => {
  try {
    const requiredFields = [
      'package',
      'subscription_amount',
      'payment_date',
      'expiry_date',
      'paid_subscription'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const success = await upgradeUserPackage(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: '✅ Package upgraded successfully' });
  } catch (err) {
    console.error('❌ Error upgrading package:', err);
    res.status(500).json({ message: 'Server error during package upgrade' });
  }
});

module.exports = router;
