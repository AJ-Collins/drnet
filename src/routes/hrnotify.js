const express = require('express');
const router = express.Router();
const mailService = require('../services/mailService');
const smsService = require('../services/smsService');

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

/**
 * @route POST /api/hr/dispatch/sms
 * @desc Send SMS to recipient
 */
router.post('/dispatch/sms', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ 
            error: "Phone number and message are required" 
        });
    }

    try {
        const result = await smsService.sendSMS(phone, message);
        
        res.json({
            success: true,
            message: "SMS sent successfully",
            data: result
        });
    } catch (error) {
        console.error("SMS Dispatch Error:", error.message);
        res.status(500).json({ 
            error: error.message || "Failed to send SMS" 
        });
    }
});

/**
 * @route POST /api/hr/dispatch/sms/bulk
 * @desc Send bulk SMS to multiple recipients
 */
router.post('/dispatch/sms/bulk', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ 
            error: "Messages array is required and must not be empty" 
        });
    }

    try {
        const result = await smsService.sendBulkSMS(messages);
        res.json({
            success: true,
            message: "Bulk SMS sent successfully",
            data: result
        });
    } catch (error) {
        console.error("Bulk SMS Dispatch Error:", error.message);
        res.status(500).json({ 
            error: error.message || "Failed to send bulk SMS" 
        });
    }
});

/**
 * @route GET /api/hr/dispatch/sms/balance
 * @desc Check SMS account balance
 */
router.get('/dispatch/sms/balance', async (req, res) => {
    try {
        const balance = await smsService.getBalance();
        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error("SMS Balance Check Error:", error.message);
        res.status(500).json({ 
            error: error.message || "Failed to check SMS balance" 
        });
    }
});


/**
 * @route POST /api/hr/contacts/upload
 * @desc Upload contacts to SMS service address book
 */
router.post('/dispatch/contacts/upload', async (req, res) => {
    const { contacts, groupId } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ 
            error: "Contacts array is required and must not be empty" 
        });
    }

    // Validate each contact has at least a phone number
    const invalidContacts = contacts.filter(contact => !contact.phone);
    if (invalidContacts.length > 0) {
        return res.status(400).json({ 
            error: "Each contact must have a phone number",
            invalidContacts: invalidContacts.length
        });
    }

    try {
        const result = await smsService.uploadContacts(contacts, groupId);
        
        res.json({
            success: true,
            message: "Contacts uploaded successfully",
            data: result
        });
    } catch (error) {
        console.error("Contact Upload Error:", error.message);
        res.status(500).json({ 
            error: error.message || "Failed to upload contacts" 
        });
    }
});

module.exports = router;