const express = require('express');
const router = express.Router();
const SubscriptionManager = require('../models/SubscriptionManager');

const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
// 1. Dashboard Init Data
router.get('/dashboard-data', async (req, res) => {
    try {
        const data = await SubscriptionManager.getDashboardData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Payments for a specific user
router.get('/payments/:userId', async (req, res) => {
    try {
        const payments = await SubscriptionManager.getUserPayments(req.params.userId);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create Subscription
router.post('/subscribe', async (req, res) => {
    try {
        await SubscriptionManager.createSubscription(req.body);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create subscription" });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        await SubscriptionManager.updateSubscription(req.params.id, req.body);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update subscription" });
    }
})

// 4. Renew Subscription
router.put('/renew/:id', async (req, res) => {
    try {
        await SubscriptionManager.renewSubscription(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to renew subscription" });
    }
});

// 5. Delete Subscription
router.delete('/delete/:id', async (req, res) => {
    try {
        await SubscriptionManager.deleteSubscription(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/metrics', async (req, res) => {
    try {
        const nowTimestamp = toSqlDatetime(new Date());
        const metrics = await SubscriptionManager.getSubscriptionMetrics(nowTimestamp);
        res.json(metrics);
    } catch (error) {
        console.error("Route Error:", error); 
        res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
});

// Route to manually extend/set expiry date
router.patch('/extend-expiry/:id', async (req, res) => {
    try {
        const { expiry_date } = req.body;
        
        if (!expiry_date) {
            return res.status(400).json({ error: "New expiry date is required" });
        }

        await SubscriptionManager.extendExpiry(req.params.id, expiry_date);
        res.json({ success: true, message: "Subscription expiry updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update expiry date" });
    }
});

module.exports = router;