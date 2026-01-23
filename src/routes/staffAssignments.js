const express = require('express');
const router = express.Router();
const StaffModel = require('../models/StaffAssignments');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get all assignments for the logged-in staff
router.get('/my-assignments/:staffId', async (req, res) => {
  try {
    const tasks = await StaffModel.getStaffTasks(req.params.staffId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a message and emit socket event
router.post('/tickets/:ticketId/message', async (req, res) => {
  const { staffId, message } = req.body;
  const { ticketId } = req.params;
  const io = req.app.get('socketio');

  try {
    const messageId = await StaffModel.addTicketMessage(ticketId, staffId, message);
    
    // Emit to the specific ticket room
    io.to(`ticket_${ticketId}`).emit('newMessage', {
      ticketId,
      message,
      senderStaffId: staffId,
      created_at: new Date()
    });

    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Status
router.patch('/assignment/:type/:id/status', async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;
  try {
    await StaffModel.updateAssignmentStatus(type, id, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;