const express = require('express');
const router = express.Router();
const SupervisorDashboard = require('../models/SuperviDashboard');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

router.get('/dashboard-stats', async (req, res) => {
    try {
        const stats = await SupervisorDashboard.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to load dashboard stats" });
    }
});

module.exports = router;