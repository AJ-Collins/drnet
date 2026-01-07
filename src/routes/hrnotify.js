const express = require('express');
const router = express.Router();
const mailService = require('../services/mailService');

router.post('/dispatch/mail', async (req, res) => {
    const { recipient, subject, body } = req.body;

    if (!recipient || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await mailService.sendEmail(recipient, subject, body);
        res.json({ success: true, message: "Email dispatched successfully" });
    } catch (error) {
        console.error("Email Service Error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

module.exports = router;