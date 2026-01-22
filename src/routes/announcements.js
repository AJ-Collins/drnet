const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const db = require("../config/db");
const notificationService = require("../services/notificationService");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET all active announcements (everyone)
router.get("/team/announcements", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, 
        COALESCE(
        NULLIF(CONCAT(COALESCE(s.first_name,''),' ',COALESCE(s.second_name,'')),' '),
        s.email,
        'Unknown'
        ) AS posted_by_name
    FROM announcements a
    LEFT JOIN staff s 
        ON a.posted_by_id = s.id AND a.posted_by_type = 'staff'
    WHERE a.is_active = TRUE
    ORDER BY a.created_at DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      announcements: rows,
    });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load announcements" });
  }
});

// CREATE new announcement (Admin only)
router.post("/team/announcements", async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body || title.trim() === "" || body.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Title and message required" });
  }

  try {
    // Create the announcement
    const result = await Announcement.create({
      title: title.trim(),
      message: body.trim(),
      posted_by_id: req.session.user.id,
      posted_by_type: req.session.user.userType || "admin",
      is_active: true,
    });

    const announcementId = result.insertId;
    const posterName = req.session.user.first_name 
      ? `${req.session.user.first_name} ${req.session.user.second_name || ''}`.trim()
      : req.session.user.email || 'Admin';

    // Admin notitifications only
    await notificationService.createForRole({
      type: 'announcement',
      reference_id: announcementId,
      title: title.trim() || 'New announcement',
      message: body.trim() || 'N/A',
      role_id: [1,2,3]
    });

    res.json({ 
      success: true, 
      message: "Announcement published and notifications sent" 
    });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ success: false, message: "Failed to publish" });
  }
});

// UPDATE announcement (Admin only)
router.put("/team/announcements/:id", async (req, res) => {
  const { id } = req.params;
  const { title, message, is_active } = req.body;

  if (!title || !message) {
    return res
      .status(400)
      .json({ success: false, message: "Title and message required" });
  }

  try {
    await Announcement.update(id, {
      title: title.trim(),
      message: message.trim(),
      is_active: is_active !== undefined ? !!is_active : undefined,
    });

    res.json({ success: true, message: "Announcement updated" });
  } catch (err) {
    console.error("Error updating announcement:", err);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
});

// DELETE announcement (Admin only)
router.delete("/team/announcements/:id", async (req, res) => {
  try {
    await Announcement.delete(req.params.id);
    res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
});

module.exports = router;
