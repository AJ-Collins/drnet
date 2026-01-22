const express = require("express");
const router = express.Router();
const TeamMessage = require("../models/TeamMessage");
const db = require("../config/db");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET all team messages (latest first)
router.get("/team/messages", async (req, res) => {
  try {
    const [messages] = await db.query(`
      SELECT 
        tm.*, 
        COALESCE(
            NULLIF(CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.second_name, '')), ' '),
            s.email,
            'Unknown'
        ) AS sender_name,
        COALESCE(r.name, 'Staff') AS sender_role
    FROM team_messages tm
    LEFT JOIN staff s 
        ON tm.sender_id = s.id 
        AND tm.sender_type = 'staff'
    LEFT JOIN roles r
        ON s.role_id = r.id
    ORDER BY tm.created_at DESC
    LIMIT 100
    `);

    res.json({
      success: true,
      count: messages.length,
      messages: messages.reverse(), // oldest first for chat
    });
  } catch (err) {
    console.error("Error fetching team messages:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load messages" });
  }
});

// POST new team message
router.post("/team/messages", async (req, res) => {
  const { message } = req.body;
  const senderId = req.session.user.id;
  const senderType = req.session.user.userType || "staff"; // 'staff' or 'admin'

  if (!message || message.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Message cannot be empty" });
  }

  if (message.length > 2000) {
    return res
      .status(400)
      .json({ success: false, message: "Message too long" });
  }

  try {
    await TeamMessage.create({
      sender_id: senderId,
      sender_type: senderType,
      message: message.trim(),
    });

    // Return fresh list (or just success)
    res.json({ success: true, message: "Sent!" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// DELETE single message (Admin only)
router.delete("/team/messages/:id", async (req, res) => {
  if (req.session.user.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  try {
    await TeamMessage.delete(req.params.id);
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
});

// CLEAR ALL messages (Admin only)
router.delete("/team/messages", async (req, res) => {
  if (req.session.user.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  try {
    await db.query(`DELETE FROM team_messages`);
    await db.query(`ALTER TABLE team_messages AUTO_INCREMENT = 1`);
    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    console.error("Clear chat error:", err);
    res.status(500).json({ success: false, message: "Failed to clear chat" });
  }
});

// GET online team members (simple version - you can enhance with WebSocket later)
router.get("/team/members", async (req, res) => {
  try {
    const [staff] = await db.query(`
      SELECT 
        s.id, 
        COALESCE(NULLIF(CONCAT(s.first_name, ' ', s.second_name), ' '), s.email) AS name,
        COALESCE(r.name, 'Staff') AS role,
        'online' as online
    FROM staff s
    LEFT JOIN roles r ON s.role_id = r.id
    WHERE s.is_active = TRUE
    ORDER BY name
    `);

    res.json(staff);
  } catch (err) {
    res.status(500).json([]);
  }
});

router.get("/auth/me", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  // Return safe user info
  res.json({
    success: true,
    id: req.session.user.id,
    name:
      req.session.user.name ||
      req.session.user.first_name + " " + (req.session.user.second_name || ""),
    role: req.session.user.role || "Staff",
    userType: req.session.user.userType || "staff",
  });
});

module.exports = router;
