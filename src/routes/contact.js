const express = require('express');
const router = express.Router();
const { saveContact } = require('../models/Contact');

router.get('/test', (req, res) => res.send('📬 Contact route working'));

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await saveContact(name, email, message);
    res.status(201).json({ message: '✅ Message received' });
  } catch (err) {
    console.error("❌ Error saving contact:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
