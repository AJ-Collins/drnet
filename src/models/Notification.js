const db = require("../config/db");

const Notification = {
  create: async (data) => {
    const { type, reference_id, title, message, role_id, user_id, is_read } = data;
    const [result] = await db.query(
      `INSERT INTO notifications (type, reference_id, title, message, role_id, user_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, reference_id, title, message, role_id, user_id || null, is_read || false]
    );
    return result;
  },

  createBulk: async (notifications) => {
    if (!notifications || notifications.length === 0) {
      return { affectedRows: 0 };
    }

    const placeholders = notifications.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
    const values = notifications.flatMap(n => [
      n.type,
      n.reference_id || null,
      n.title,
      n.message,
      n.role_id, // REQUIRED
      n.user_id || null,
      n.is_read || false
    ]);

    const [result] = await db.query(
      `INSERT INTO notifications (type, reference_id, title, message, role_id, user_id, is_read) 
       VALUES ${placeholders}`,
      values
    );
    return result;
  },

  /**
   * Find notifications for a user based on their role
   * Returns notifications where:
   * 1. role_id matches user's role AND user_id is NULL (role-wide notifications)
   * 2. role_id matches user's role AND user_id matches (user-specific notifications)
   */
  findForUser: async (userId, userRoleId) => {
    const query = `
      SELECT 
        n.*,
        CASE 
          WHEN n.user_id IS NULL THEN 'role'
          ELSE 'personal'
        END as notification_scope
      FROM notifications n
      WHERE n.role_id = ?
        AND (n.user_id IS NULL OR n.user_id = ?)
      ORDER BY n.created_at DESC
    `;
    const [rows] = await db.query(query, [userRoleId, userId]);
    return rows;
  },

  /**
   * Get unread count for user based on their role
   */
  getUnreadCount: async (userId, userRoleId) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE is_read = FALSE 
        AND role_id = ?
        AND (user_id IS NULL OR user_id = ?)
    `;
    const [rows] = await db.query(query, [userRoleId, userId]);
    return rows[0].count;
  },

  /**
   * Mark notification as read (with role check for security)
   */
  markAsRead: async (notificationId, userId, userRoleId) => {
    const [result] = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = ?
         AND role_id = ?
         AND (user_id IS NULL OR user_id = ?)`,
      [notificationId, userRoleId, userId]
    );
    return result;
  },

  /**
   * Mark all as read for user (respecting role)
   */
  markAllAsReadForUser: async (userId, userRoleId) => {
    const [result] = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE is_read = FALSE
         AND role_id = ?
         AND (user_id IS NULL OR user_id = ?)`,
      [userRoleId, userId]
    );
    return result;
  },

  /**
   * Delete notification (with role check)
   */
  delete: async (notificationId, userId, userRoleId) => {
    const [result] = await db.query(
      `DELETE FROM notifications 
       WHERE id = ?
         AND role_id = ?
         AND (user_id IS NULL OR user_id = ?)`,
      [notificationId, userRoleId, userId]
    );
    return result;
  },

  /**
   * Admin: Get all notifications (no role restriction)
   */
  findAll: async (filters = {}) => {
    let query = 'SELECT n.*, r.role_name FROM notifications n LEFT JOIN roles r ON n.role_id = r.id WHERE 1=1';
    const params = [];

    if (filters.role_id) {
      query += ' AND n.role_id = ?';
      params.push(filters.role_id);
    }

    if (filters.type) {
      query += ' AND n.type = ?';
      params.push(filters.type);
    }

    if (filters.is_read !== undefined) {
      query += ' AND n.is_read = ?';
      params.push(filters.is_read);
    }

    query += ' ORDER BY n.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Cleanup old read notifications
   */
  deleteOldRead: async (daysOld = 30) => {
    const [result] = await db.query(
      `DELETE FROM notifications 
       WHERE is_read = TRUE 
       AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysOld]
    );
    return result;
  },
};

module.exports = Notification;