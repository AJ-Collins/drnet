const express = require('express');
const router = express.Router();
const SubscriptionManager = require('../models/SubscriptionManager');

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

module.exports = router;