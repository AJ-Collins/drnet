const express = require('express');
const router = express.Router();
const HrInbox = require("../models/HrInbox");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// all active messages
router.get('/inbox', async (req, res) => {
    try {
        const rows = await HrInbox.getAllActive();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch inbox data" });
    }
});

// CEO sends a message
router.post('/inbox/send', async (req, res) => {
    const { message_content, priority } = req.body;
    try {
        const newMessage = await HrInbox.create(message_content, priority);
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Update message content
router.patch('/inbox/update/:id', async (req, res) => {
    const { id } = req.params;
    const { message_content, priority } = req.body;

    try {
        const updatedMessage = await HrInbox.update(id, message_content, priority);
        
        if (!updatedMessage) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json({ 
            success: true, 
            message: "Instruction updated successfully",
            data: updatedMessage 
        });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Failed to update the message" });
    }
});

// Mark messages as SEEN
router.patch('/inbox/mark-seen', async (req, res) => {
    try {
        await HrInbox.markAllAsSeen();
        res.json({ success: true, message: "Messages marked as seen" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update seen status" });
    }
});

// Mark specific message as PROCESSED
router.patch('/inbox/:id', async (req, res) => {
    try {
        await HrInbox.setProcessed(req.params.id);
        res.json({ success: true, message: "Intelligence processed" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update process status" });
    }
});

// Remove/Archive a message
router.delete('/inbox/:id', async (req, res) => {
    try {
        await HrInbox.remove(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete message" });
    }
});

module.exports = router;