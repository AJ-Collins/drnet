const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

/**
 * GET /api/notifications
 * Get notifications for current user based on their role
 */
router.get("/notifications", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRoleId = req.session.user.role_id;

    if (!userRoleId) {
      return res.status(400).json({ 
        success: false, 
        message: "User role not found" 
      });
    }

    const notifications = await Notification.findForUser(userId, userRoleId);
    const unreadCount = await Notification.getUnreadCount(userId, userRoleId);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load notifications" 
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get("/notifications/unread-count", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRoleId = req.session.user.role_id;

    const count = await Notification.getUnreadCount(userId, userRoleId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get count" 
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put("/notifications/:id/read", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user.id;
    const userRoleId = req.session.user.role_id;

    const result = await Notification.markAsRead(notificationId, userId, userRoleId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update" 
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put("/notifications/read-all", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userRoleId = req.session.user.role_id;

    await Notification.markAllAsReadForUser(userId, userRoleId);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update" 
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete("/notifications/:id", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user.id;
    const userRoleId = req.session.user.role_id;

    const result = await Notification.delete(notificationId, userId, userRoleId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete" 
    });
  }
});

/**
 * POST /api/notifications/create (Admin only)
 * Manually create notification for specific role(s)
 */
router.post("/notifications/create", async (req, res) => {
  try {
    const { type, reference_id, title, message, role_id } = req.body;

    if (!title || !message || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and role_id are required",
      });
    }

    await notificationService.createForRole({
      type: type || 'system',
      reference_id: reference_id || null,
      title,
      message,
      role_id,
    });

    res.json({
      success: true,
      message: "Notification created successfully",
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create notification" 
    });
  }
});

/**
 * GET /api/notifications/admin/all (Admin only)
 * Get all notifications across all roles
 */
router.get("/notifications/admin/all", async (req, res) => {
  try {
    // Check if user is admin
    if (req.session.user.role_id !== 1) { // Assuming 1 is admin role
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const notifications = await Notification.findAll();

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to load notifications" 
    });
  }
});

module.exports = router;