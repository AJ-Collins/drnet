const express = require('express');
const router = express.Router();
const { createRenewal, getAllRenewals } = require('../models/Renewal');
const { getUserById, updateUser } = require('../models/User');
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const renewals = await getAllRenewals();
    res.json(renewals);
  } catch (err) {
    console.error('❌ Error fetching renewals:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    await createRenewal(data);
    res.status(201).json({ message: '✅ Renewal recorded' });
  } catch (err) {
    console.error('❌ Error creating renewal:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/renew', async (req, res) => {
  try {
    const { userId, amount, renewalDate, paidSubscription } = req.body;

    if (!userId || !amount || !renewalDate) {
      return res.status(400).json({ message: 'Missing required renewal fields' });
    }

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const expiryDate = new Date(new Date(renewalDate).getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDateStr = expiryDate.toISOString().split('T')[0];

    // Update user in DB
    await db.execute(`
      UPDATE users SET
        payment_date = ?, expiry_date = ?, subscription_amount = ?, paid_subscription = ?, last_renewal_date = ?
      WHERE id = ?
    `, [
      renewalDate,
      expiryDateStr,
      amount,
      paidSubscription,
      renewalDate,
      userId
    ]);

    // Add renewal to renewals table
    const renewalData = {
      userId,
      userName: user.name,
      amount,
      renewalDate,
      expiryDate: expiryDateStr,
      month: new Date(renewalDate).toLocaleString('default', { month: 'long' }),
      year: new Date(renewalDate).getFullYear(),
      isDeleted: false
    };

    await createRenewal(renewalData);

    res.status(201).json({ message: '✅ User renewed and renewal recorded' });
  } catch (err) {
    console.error('❌ Error processing renewal:', err);
    res.status(500).json({ message: 'Server error during renewal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, renewal_date, expiry_date, month, year, is_deleted } = req.body;

    const [rows] = await db.execute('SELECT * FROM renewals WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Renewal not found' });

    await db.execute(`
      UPDATE renewals SET
        amount = ?, renewal_date = ?, expiry_date = ?, month = ?, year = ?, is_deleted = ?
      WHERE id = ?
    `, [
      amount || rows[0].amount,
      renewal_date || rows[0].renewal_date,
      expiry_date || rows[0].expiry_date,
      month || rows[0].month,
      year || rows[0].year,
      is_deleted !== undefined ? is_deleted : rows[0].is_deleted,
      id
    ]);

    res.json({ message: '✅ Renewal updated' });
  } catch (err) {
    console.error('❌ Error updating renewal:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;