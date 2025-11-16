const express = require("express");
const router = express.Router();

const SupportTicket = require("../models/SupportTicket");
const SupportTicketMessage = require("../models/SupportTicketMessage");

router.get("/my/tickets", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Please log in to view tickets",
      });
    }
    const ticket = await SupportTicket.findAllByUser(req.session.user.id);
    res.json(Array.isArray(ticket) ? ticket : [ticket]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/my/tickets", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Please log in to view tickets",
      });
    }
    const user_id = req.session.user.id;
    const { subject, issue_type, priority = "medium", description } = req.body;

    const ticket_number = `TKT-${Date.now().toString().slice(-6)}`;

    const ticket = await SupportTicket.create({
      ticket_number,
      user_id,
      subject,
      issue_type,
      priority,
      description,
      status: "open",
      assigned_to: null,
    });

    res.json(ticket); // ← full ticket with description
  } catch (err) {
    console.error("Ticket creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/my/tickets/:id/resolve", async (req, res) => {
  try {
    await SupportTicket.updateStatus(req.params.id, "resolved");
    const updated = await SupportTicket.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/my/messages", async (req, res) => {
  try {
    const messages = await SupportTicketMessage.findAllByUser(
      req.session.user.id
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/my/messages", async (req, res) => {
  try {
    const { ticket_id, sender_user_id, sender_staff_id, message } = req.body;

    const result = await SupportTicketMessage.create({
      ticket_id,
      sender_user_id,
      sender_staff_id,
      message,
    });

    const created = await SupportTicketMessage.findById(result.insertId);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Admin support ticket routes
// GET all tickets (admin)
router.get("/tickets", async (req, res) => {
  try {
    const tickets = await SupportTicket.findAllByUser(null);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE ticket
router.post("/tickets", async (req, res) => {
  try {
    const { fullName, phone, issue_type, priority, status, ticket_number } =
      req.body;

    const result = await SupportTicket.create({
      ticket_number,
      user_id: 1, // placeholder
      subject: `${issue_type} - ${fullName}`,
      issue_type,
      priority,
      description: "",
      status: status || "Pending",
      assigned_to: null,
    });

    const ticket = await SupportTicket.findById(result.insertId);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ticket
router.put("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, issue_type, priority, status } = req.body;

    await SupportTicket.update(id, {
      subject: `${issue_type} - ${fullName}`,
      issue_type,
      priority,
      status,
    });

    const updated = await SupportTicket.findById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE status only
router.patch("/tickets/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await SupportTicket.updateStatus(id, status);

    const updated = await SupportTicket.findById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ticket
router.delete("/tickets/:id", async (req, res) => {
  try {
    await SupportTicket.delete(req.params.id);
    await SupportTicketMessage.deleteByTicket(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MESSAGES

// GET all messages (admin)
router.get("/messages", async (req, res) => {
  try {
    let messages;
    if (req.query.ticket_id) {
      // return messages for a specific ticket
      messages = await SupportTicketMessage.findAllByTicket(
        req.query.ticket_id
      );
    } else {
      // return all messages
      messages = await SupportTicketMessage.findAll(); // new helper
    }

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/messages/ticket/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await SupportTicketMessage.findAllByTicket(id);

    if (!messages.length) {
      return res.status(404).json({
        success: false,
        message: "No messages found for this ticket",
      });
    }

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/ticket/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;

    const messages = await SupportTicketMessage.findAllByTicket(ticketId);

    if (!messages.length) {
      return res.status(404).json({
        success: false,
        message: "No messages found for this ticket",
      });
    }

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE message
router.post("/messages", async (req, res) => {
  try {
    const staffId = req.session.user?.id;
    if (!staffId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const messageData = {
      ticket_id: req.body.ticket_id,
      sender_staff_id: staffId,
      sender_user_id: req.body.sender_user_id || null,
      message: req.body.message,
    };

    const result = await SupportTicketMessage.create(messageData);
    const msg = await SupportTicketMessage.findById(result.insertId);

    res.json(msg);
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE all messages for a ticket
router.delete("/messages/ticket/:ticket_id", async (req, res) => {
  try {
    await SupportTicketMessage.deleteByTicket(req.params.ticket_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
