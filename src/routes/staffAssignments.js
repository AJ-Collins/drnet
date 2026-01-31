const express = require("express");
const router = express.Router();
const AssignmentModel = require("../models/StaffAssignments");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get all assignments for logged-in staff
router.get("/my-assignments", async (req, res) => {
  try {
    const staffId = req.session.user.id;

    const assignments = await AssignmentModel.getStaffAssignments(staffId);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get assignment counts
router.get("/my-assignments/:staffId/counts", async (req, res) => {
  try {
    const staffId = req.session.user.id;

    const counts = await AssignmentModel.getAssignmentCounts(staffId);
    res.json(counts);
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
});

// Get ticket details
router.get("/tickets/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const staffId = req.session.user.id;

    const ticket = await AssignmentModel.getTicketAssignment(ticketId, staffId);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found or not assigned to you" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

// Get ticket messages
router.get("/tickets/:ticketId/messages", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const messages = await AssignmentModel.getTicketMessages(ticketId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message to ticket
router.post("/tickets/:ticketId/message", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const staffId = req.session.user.id;

    const messageId = await AssignmentModel.sendTicketMessage(ticketId, staffId, message);
    
    const messages = await AssignmentModel.getTicketMessages(ticketId);
    const newMessage = messages.find(m => m.id === messageId);
    
    if (!newMessage) {
      throw new Error("Failed to retrieve sent message");
    }

    const messageData = {
      id: newMessage.id,
      ticket_id: parseInt(ticketId),
      ticketId: parseInt(ticketId),
      sender_staff_id: newMessage.sender_staff_id,
      senderStaffId: newMessage.sender_staff_id,
      sender_user_id: newMessage.sender_user_id,
      message: newMessage.message,
      created_at: newMessage.created_at,
      staff_name: newMessage.staff_name,
      user_name: newMessage.user_name
    };

    const io = req.app.get('socketio');
    if (io) {
      io.to(`ticket_${ticketId}`).emit('newMessage', messageData);
      console.log(`✓ Message broadcasted to ticket_${ticketId}:`, messageData.message);
    } else {
      console.warn('⚠ Socket.IO not available for broadcasting');
    }

    res.json({ success: true, messageId, message: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Update assignment status
router.patch("/assignment/:type/:id/status", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;
    const staffId = req.session.user.id;

    if (!['pending', 'seen', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let success;
    
    if (type === 'ticket') {
      success = await AssignmentModel.updateTicketAssignmentStatus(id, staffId, status);
    } else if (type === 'task') {
      success = await AssignmentModel.updateTaskAssignmentStatus(id, staffId, status);
    } else {
      return res.status(400).json({ error: "Invalid assignment type" });
    }

    if (success) {
      res.json({ success: true, message: "Status updated successfully" });
    } else {
      res.status(404).json({ error: "Assignment not found or not authorized" });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Mark assignment as seen
router.post("/assignment/:type/:id/seen", async (req, res) => {
  try {
    const { type, id } = req.params;
    const staffId = req.session.user.id;

    await AssignmentModel.markAsSeen(type, id, staffId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as seen:", error);
    res.status(500).json({ error: "Failed to mark as seen" });
  }
});

module.exports = router;