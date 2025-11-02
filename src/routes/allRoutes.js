const express = require('express');
const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.send('🎯 All routes root endpoint working');
});

module.exports = router;
