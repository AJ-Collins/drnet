const express = require("express");
const router = express.Router();
const SupportModel = require("../models/SupportTicket");
const User = require("../models/User");
const Staff = require("../models/Staff");
const smsService = require("../services/smsService");

const apiSessionAuth = require("../middleware/apiSessionAuth");
const { json } = require("sequelize");

router.use(apiSessionAuth);

// Get all tickets
router.get("/tickets", async (req, res) => {
    try {
        const archived = req.query.archived === 'true';
        const tickets = await SupportModel.findAll(archived);
        res.json(tickets);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get archived list
router.get("/tickets/archived", async (req, res) => {
  try {
    const tickets = await SupportModel.getArchivedTickets();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket
router.get("/tickets/:id", async (req, res) => {
    try {
        const ticket = await SupportModel.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });
        res.json(ticket);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new ticket
router.post("/tickets", async (req, res) => {
    try {
        const { send_sms, user_id, issue_subject, description } = req.body;
        const ticketNumber = 'TK-' + Date.now().toString().slice(-6);

        const ticketId = await SupportModel.create({ 
            user_id, 
            issue_subject, 
            description, 
            ticket_number: ticketNumber 
        });

        if (send_sms) {
            const client = await User.findById(user_id);
            if (client && client.phone) {
                const smsBody = `Hi ${client.first_name}, a support ticket #${ticketNumber} has been created for: ${issue_subject}. We will resolve it soon.`;
                await smsService.sendSMS(client.phone, smsBody);
            }
        }

        res.status(201).json({ success: true, ticketId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


router.post("/tickets/assign", async (req, res) => {
    try {
        const { ticket_id, staff_id, note, send_sms } = req.body;

        const staff = await SupportModel.assignStaff(
            ticket_id, 
            staff_id, 
            note
        );

        if (send_sms) {
            const staff = await Staff.findById(staff_id);
            if (staff && staff.phone) {
                const smsBody = `Hi ${staff.first_name}, you've been assigned to support Ticket #${ticket_id}. Task: ${note}`;
                await smsService.sendSMS(staff.phone, smsBody);
            }
        }

        res.json({ success: true, staff });
    } catch (err) { 
        console.error("Assignment Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// Fetch assignments
router.get("/tickets/:id/assignments", async (req, res) => {
    try {
        const assignments = await SupportModel.getAssignments(req.params.id);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Post a message (Real-time trigger should happen here)
router.post("/messages", async (req, res) => {
    try {
        // middleware ensures req.session.user exists
        const staffId = req.session.user.id; 

        const messageData = {
            ticket_id: req.body.ticket_id,
            message: req.body.message,
            sender_staff_id: staffId
        };

        const fullMessage = await SupportModel.saveMessage(messageData);
        
        const io = req.app.get('socketio');
        if (io) {
            // Send ONLY to users in this ticket's room
            io.to(`ticket_${req.body.ticket_id}`).emit('newMessage', fullMessage);
        }
        
        res.json({ success: true, message: fullMessage });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// Fetch messages for a ticket
router.get("/tickets/:id/messages", async (req, res) => {
    try {
        const messages = await SupportModel.getMessagesByTicket(req.params.id);
        res.json(messages);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/tickets/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        // Use the model method you already defined
        await SupportModel.updateStatus(id, status);
        res.json({ success: true, message: `Ticket marked as ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH route for archiving
router.patch("/tickets/:id/archive", async (req, res) => {
    try {
        await SupportModel.archive(req.params.id);
        res.json({ success: true, message: "Ticket archived" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Revoke Assignment
router.delete("/tickets/:id/assign/:staff_id", async (req, res) => {
    try {
        await SupportModel.removeAssignment(req.params.id, req.params.staff_id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete ticket
router.delete("/tickets/:id", async (req, res) => {
  try {
    await SupportModel.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
})

// Unarchive (Restore) a ticket
router.patch("/tickets/:id/restore", async (req, res) => {
  try {
    await SupportModel.setArchiveStatus(req.params.id, false);
    res.json({ success: true, message: "Ticket restored to active list" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;