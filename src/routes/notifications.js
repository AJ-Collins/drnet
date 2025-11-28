const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const db = require("../config/db");

// GET all notifications for the logged-in user based on their role
router.get("/", async (req, res) => {
  try {
    // 1. Check if user exists in staff table
    const [staffExists] = await db.query(
      "SELECT id FROM staff WHERE id = ?",
      [req.session.user.id]
    );

    if (staffExists.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User is not staff.",
      });
    }

    // 2. Fetch ALL notifications for all staff
    const [notifications] = await db.query(`
      SELECT 
        id, type, reference_id, title, message, role_id,
        is_read, created_at, updated_at
      FROM notifications
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    });

  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
});


// GET unread notifications count
router.get("/unread-count", async (req, res) => {
  try {
    const userRoleId = req.session.user.role_id;

    const [result] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE role_id = ? AND is_read = FALSE
      `,
      [userRoleId]
    );

    res.json({
      success: true,
      count: result[0].count,
    });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    });
  }
});

// GET single notification by ID (with role validation)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.session.user.role_id;

    const [notifications] = await db.query(
      `
      SELECT 
        id,
        type,
        reference_id,
        title,
        message,
        role_id,
        is_read,
        created_at,
        updated_at
      FROM notifications
      WHERE id = ? AND role_id = ?
      `,
      [id, userRoleId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Notification not found or access denied",
      });
    }

    res.json({
      success: true,
      data: notifications[0],
    });
  } catch (err) {
    console.error("Error fetching notification:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notification",
    });
  }
});

// PATCH - Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.session.user.role_id;

    // Verify the notification belongs to the user's role
    const [check] = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND role_id = ?`,
      [id, userRoleId]
    );

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Notification not found or access denied",
      });
    }

    await Notification.markAsRead(id);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
});

// PATCH - Mark all notifications as read for current user
router.patch("/mark-all-read", async (req, res) => {
  try {
    const userRoleId = req.session.user.role_id;

    const [result] = await db.query(
      `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE role_id = ? AND is_read = FALSE
      `,
      [userRoleId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.affectedRows,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
});

// DELETE - Delete a notification (with role validation)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.session.user.role_id;

    // Verify the notification belongs to the user's role
    const [check] = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND role_id = ?`,
      [id, userRoleId]
    );

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Notification not found or access denied",
      });
    }

    await Notification.delete(id);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
});

// DELETE - Clear all read notifications for current user
router.delete("/clear/read", async (req, res) => {
  try {
    const userRoleId = req.session.user.role_id;

    const [result] = await db.query(
      `
      DELETE FROM notifications 
      WHERE role_id = ? AND is_read = TRUE
      `,
      [userRoleId]
    );

    res.json({
      success: true,
      message: "Read notifications cleared",
      deletedCount: result.affectedRows,
    });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({
      success: false,
      error: "Failed to clear notifications",
    });
  }
});

// POST - Create a notification (Admin only)
router.post("/", async (req, res) => {
  try {
    const { type, reference_id, title, message, role_id } = req.body;

    if (!type || !title || !message || !role_id) {
      return res.status(400).json({
        success: false,
        error: "Type, title, message, and role_id are required",
      });
    }

    // Extract user info from session
    const createdBy = req.session.user.id;
    const createdByRole = req.session.user.role_id;

    const result = await Notification.create({
      type,
      reference_id: reference_id || null,
      title,
      message,
      role_id,
      is_read: false,
    });

    // Optional: Log who created the notification
    console.log(
      `Notification created by user ID: ${createdBy} (Role: ${createdByRole})`
    );

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
    });
  }
});
module.exports = router;
