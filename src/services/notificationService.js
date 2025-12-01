const Notification = require("../models/Notification");
const db = require("../config/db");

class NotificationService {
  /**
   * Create notification visible to specific role(s)
   * Users can only see notifications if their role_id matches
   */
  async createForRole({ type, reference_id, title, message, role_id }) {
    try {
      const roleIds = Array.isArray(role_id) ? role_id : [role_id];
      
      const notifications = roleIds.map(rid => ({
        type,
        reference_id,
        title,
        message,
        role_id: rid,
        user_id: null, // null means "all users with this role"
        is_read: false,
      }));

      await Notification.createBulk(notifications);
      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("Error creating role notifications:", error);
      throw error;
    }
  }

  /**
   * Create notification for specific user (still respects their role)
   */
  async createForUser({ type, reference_id, title, message, user_id, role_id }) {
    try {
      const userIds = Array.isArray(user_id) ? user_id : [user_id];
      
      // If role_id not provided, fetch it from user
      if (!role_id && userIds.length === 1) {
        const [users] = await db.query(
          `SELECT role_id FROM staff WHERE id = ?`,
          [userIds[0]]
        );
        role_id = users[0]?.role_id;
      }

      const notifications = userIds.map(uid => ({
        type,
        reference_id,
        title,
        message,
        user_id: uid,
        role_id: role_id, // Always set role for access control
        is_read: false,
      }));

      await Notification.createBulk(notifications);
      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("Error creating user notifications:", error);
      throw error;
    }
  }

  /**
   * Create notification for all users in specific role(s)
   * Creates individual notifications for each user
   */
  async createForAllInRole({ type, reference_id, title, message, role_id }) {
    try {
      const roleIds = Array.isArray(role_id) ? role_id : [role_id];
      
      const [users] = await db.query(
        `SELECT id, role_id FROM staff WHERE role_id IN (?) AND is_active = 1`,
        [roleIds]
      );

      if (users.length === 0) {
        return { success: true, count: 0 };
      }

      const notifications = users.map(user => ({
        type,
        reference_id,
        title,
        message,
        role_id: user.role_id,
        user_id: user.id,
        is_read: false,
      }));

      await Notification.createBulk(notifications);
      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("Error creating notifications for role:", error);
      throw error;
    }
  }

  /**
   * Create broadcast to multiple roles
   */
  async createForMultipleRoles({ type, reference_id, title, message, role_ids }) {
    try {
      return await this.createForRole({
        type,
        reference_id,
        title,
        message,
        role_id: role_ids
      });
    } catch (error) {
      console.error("Error creating multi-role notifications:", error);
      throw error;
    }
  }

  /**
   * Create notification for everyone (all roles)
   */
  async createBroadcast({ type, reference_id, title, message }) {
    try {
      // Get all active role IDs
      const [roles] = await db.query(`SELECT DISTINCT id FROM roles WHERE is_active = 1`);
      
      if (roles.length === 0) {
        return { success: true, count: 0 };
      }

      const roleIds = roles.map(r => r.id);
      
      return await this.createForRole({
        type,
        reference_id,
        title,
        message,
        role_id: roleIds
      });
    } catch (error) {
      console.error("Error creating broadcast notifications:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();