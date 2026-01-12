const express = require('express');
const router = express.Router();
const HrInboxReply = require('../models/HrInboxReply');

// POST: Send info to CEO
router.post('/dispatch/reply', async (req, res) => {
    const { message_content, priority } = req.body;
    
    if (!message_content || message_content.trim() === "") {
        return res.status(400).json({ error: "Message content is required" });
    }

    try {
        const newMessage = await HrInboxReply.create(message_content, priority);
        res.status(201).json({
            success: true,
            message: "Sent to CEO Inbox successfully",
            data: newMessage
        });
    } catch (err) {
        console.error("Dispatch Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch all CEO messages
router.get('/dispatch/inbox', async (req, res) => {
    try {
        const rows = await HrInboxReply.getAll();
        res.json(rows);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Failed to retrieve messages" });
    }
});

// Update status (e.g., mark as read/processed)
router.patch('/dispatch/inbox/update/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const updated = await HrInboxReply.updateStatus(id, status);

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("Patch Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Remove record
router.delete('/dispatch/inbox/:id', async (req, res) => {
    try {
        await HrInboxReply.remove(req.params.id);
        res.json({ success: true, message: "Record removed" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Failed to delete record" });
    }
});

module.exports = router;