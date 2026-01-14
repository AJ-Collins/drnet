const express = require('express');
const router = express.Router();
const SmsLog = require('../models/SmsLogsModel');

// GET Dashboard Data
router.get('/sms/log', async (req, res) => {
    try {
        const subscriptions = await SmsLog.getDashboardData();
        res.json({ success: true, subscriptions });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// POST Log Single
router.post('/sms/log', async (req, res) => {
    const { subscriptionId, phone, message, type } = req.body; 

    if (!subscriptionId || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await SmsLog.logSingle({
            subscriptionId,
            phone,
            type: type || 'custom',
            message
        });
        res.json({ success: true, message: "Log saved" });
    } catch (error) {
        console.error("Single Log Error:", error);
        res.status(500).json({ error: "Failed to save log" });
    }
});

// POST Log Bulk
router.post('/sms/log/bulk', async (req, res) => {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return res.status(400).json({ error: "No logs provided" });
    }

    try {
        await SmsLog.logBulk(logs);
        res.json({ success: true, count: logs.length });
    } catch (error) {
        console.error("Bulk Log Error:", error);
        res.status(500).json({ error: "Failed to save bulk logs" });
    }
});

// GET History
router.get('/sms/log/:id', async (req, res) => {
    try {
        const history = await SmsLog.getHistory(req.params.id);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

module.exports = router;