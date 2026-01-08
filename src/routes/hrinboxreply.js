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

// GET: Fetch all CEO messages
router.get('/dispatch/inbox', async (req, res) => {
    try {
        const rows = await HrInboxReply.getAll();
        res.json(rows);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Failed to retrieve messages" });
    }
});

// PATCH: Update status (e.g., mark as read/processed)
router.patch('/dispatch/inbox/:id', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const updated = await HrInboxReply.updateStatus(id, status);
        
        if (!updated) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json({ 
            success: true, 
            message: "Status updated", 
            data: updated 
        });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// DELETE: Remove record
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