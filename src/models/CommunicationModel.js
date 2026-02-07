const db = require("../config/db");

class CommunicationModel {
  // CHANNELS
  
  static async getAllChannels() {
    const [channels] = await db.query(`
      SELECT c.*, 
        CONCAT(s.first_name, ' ', s.second_name) as creator_name,
        (SELECT COUNT(*) FROM messages WHERE channel_id = c.id AND is_deleted = FALSE) as message_count
      FROM channels c
      LEFT JOIN staff s ON c.created_by_id = s.id AND c.created_by_type = 'staff'
      WHERE c.is_active = TRUE
      ORDER BY c.is_default DESC, c.created_at DESC
    `);
    return channels;
  }

  static async getChannelById(channelId) {
    const [channels] = await db.query(`
      SELECT c.*, 
        CONCAT(s.first_name, ' ', s.second_name) as creator_name
      FROM channels c
      LEFT JOIN staff s ON c.created_by_id = s.id AND c.created_by_type = 'staff'
      WHERE c.id = ? AND c.is_active = TRUE
    `, [channelId]);
    return channels[0];
  }

  static async createChannel(data) {
    const { name, description, channel_type, created_by_id, created_by_type } = data;
    const [result] = await db.query(`
      INSERT INTO channels (name, description, channel_type, created_by_id, created_by_type)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description || null, channel_type || 'public', created_by_id, created_by_type]);
    return result.insertId;
  }

  static async deleteChannel(channelId) {
    // Don't allow deletion of default channel
    const channel = await this.getChannelById(channelId);
    if (channel && channel.is_default) {
      throw new Error("Cannot delete default channel");
    }
    
    await db.query(`
      UPDATE channels SET is_active = FALSE WHERE id = ?
    `, [channelId]);
    return true;
  }

  // MESSAGES
  
  // ✅ FIXED: Added userId and userType to calculate isFromMe
  static async getChannelMessages(channelId, userId, userType, limit = 100) {
    const [messages] = await db.query(`
      SELECT m.*,
        CASE 
          WHEN m.sender_type = 'staff' THEN CONCAT(s.first_name, ' ', s.second_name)
          ELSE 'Admin'
        END as sender_name,
        CASE 
          WHEN m.sender_type = 'staff' THEN s.image
          ELSE NULL
        END as sender_image,
        (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count,
        CASE 
          WHEN m.sender_id = ? AND m.sender_type = ? THEN TRUE
          ELSE FALSE
        END as isFromMe
      FROM messages m
      LEFT JOIN staff s ON m.sender_id = s.id AND m.sender_type = 'staff'
      WHERE m.channel_id = ? AND m.is_deleted = FALSE AND m.message_type = 'channel'
      ORDER BY m.created_at ASC
      LIMIT ?
    `, [userId, userType, channelId, limit]);
    return messages;
  }

  // ✅ FIXED: Added isFromMe calculation
  static async getDirectMessages(userId, userType, otherUserId, otherUserType, limit = 100) {
    const [messages] = await db.query(`
      SELECT m.*,
        CASE 
          WHEN m.sender_type = 'staff' THEN CONCAT(s1.first_name, ' ', s1.second_name)
          ELSE 'Admin'
        END as sender_name,
        CASE 
          WHEN m.sender_type = 'staff' THEN s1.image
          ELSE NULL
        END as sender_image,
        CASE 
          WHEN m.recipient_type = 'staff' THEN CONCAT(s2.first_name, ' ', s2.second_name)
          ELSE 'Admin'
        END as recipient_name,
        CASE 
          WHEN m.sender_id = ? AND m.sender_type = ? THEN TRUE
          ELSE FALSE
        END as isFromMe
      FROM messages m
      LEFT JOIN staff s1 ON m.sender_id = s1.id AND m.sender_type = 'staff'
      LEFT JOIN staff s2 ON m.recipient_id = s2.id AND m.recipient_type = 'staff'
      WHERE m.is_deleted = FALSE AND m.message_type = 'direct'
        AND (
          (m.sender_id = ? AND m.sender_type = ? AND m.recipient_id = ? AND m.recipient_type = ?)
          OR
          (m.sender_id = ? AND m.sender_type = ? AND m.recipient_id = ? AND m.recipient_type = ?)
        )
      ORDER BY m.created_at ASC
      LIMIT ?
    `, [
        userId, userType,  // For isFromMe
        userId, userType, otherUserId, otherUserType, 
        otherUserId, otherUserType, userId, userType, 
        limit
    ]);
    return messages;
  }

  static async sendMessage(data) {
    const { channel_id, sender_id, sender_type, recipient_id, recipient_type, message_type, content } = data;
    
    const [result] = await db.query(`
      INSERT INTO messages (channel_id, sender_id, sender_type, recipient_id, recipient_type, message_type, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [channel_id || null, sender_id, sender_type, recipient_id || null, recipient_type || null, message_type, content]);
    
    // Get the full message data
    const [messages] = await db.query(`
      SELECT m.*,
        CASE 
          WHEN m.sender_type = 'staff' THEN CONCAT(s.first_name, ' ', s.second_name)
          ELSE 'Admin'
        END as sender_name,
        CASE 
          WHEN m.sender_type = 'staff' THEN s.image
          ELSE NULL
        END as sender_image
      FROM messages m
      LEFT JOIN staff s ON m.sender_id = s.id AND m.sender_type = 'staff'
      WHERE m.id = ?
    `, [result.insertId]);
    
    return messages[0];
  }

  static async deleteMessage(messageId, userId, userType) {
    // Verify ownership
    const [messages] = await db.query(`
      SELECT * FROM messages WHERE id = ? AND sender_id = ? AND sender_type = ?
    `, [messageId, userId, userType]);
    
    if (messages.length === 0) {
      throw new Error("Message not found or unauthorized");
    }
    
    await db.query(`
      UPDATE messages SET is_deleted = TRUE WHERE id = ?
    `, [messageId]);
    return true;
  }

  static async markMessageAsRead(messageId, userId, userType) {
    await db.query(`
      INSERT IGNORE INTO message_reads (message_id, user_id, user_type)
      VALUES (?, ?, ?)
    `, [messageId, userId, userType]);
    return true;
  }

  static async getUnreadCount(userId, userType) {
    const [result] = await db.query(`
      SELECT COUNT(DISTINCT m.id) as unread_count
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ? AND mr.user_type = ?
      WHERE m.is_deleted = FALSE
        AND m.sender_id != ? 
        AND mr.id IS NULL
        AND (
          m.message_type = 'channel'
          OR (m.message_type = 'direct' AND m.recipient_id = ? AND m.recipient_type = ?)
        )
    `, [userId, userType, userId, userId, userType]);
    return result[0].unread_count;
  }

  // DIRECT MESSAGE CONTACTS
  
  static async getDirectMessageContacts(userId, userType) {
    const [contacts] = await db.query(`
        SELECT
        c.user_id,
        c.user_type,
        CASE
            WHEN c.user_type = 'staff'
            THEN CONCAT(st.first_name, ' ', st.second_name)
            ELSE 'Admin'
        END AS name,
        st.image,
        c.last_message_at,
        (
            SELECT COUNT(*)
            FROM messages m2
            LEFT JOIN message_reads mr
            ON m2.id = mr.message_id
            AND mr.user_id = ?
            AND mr.user_type = ?
            WHERE m2.is_deleted = FALSE
            AND mr.id IS NULL
            AND m2.recipient_id = ?
            AND m2.recipient_type = ?
            AND m2.sender_id = c.user_id
            AND m2.sender_type = c.user_type
        ) AS unread_count
        FROM (
        SELECT
            CASE
            WHEN sender_id = ? AND sender_type = ?
                THEN recipient_id
            ELSE sender_id
            END AS user_id,
            CASE
            WHEN sender_id = ? AND sender_type = ?
                THEN recipient_type
            ELSE sender_type
            END AS user_type,
            MAX(created_at) AS last_message_at
        FROM messages
        WHERE message_type = 'direct'
            AND is_deleted = FALSE
            AND (
            (sender_id = ? AND sender_type = ?)
            OR
            (recipient_id = ? AND recipient_type = ?)
            )
        GROUP BY user_id, user_type
        ) c
        LEFT JOIN staff st ON c.user_id = st.id AND c.user_type = 'staff'
        ORDER BY c.last_message_at DESC
    `, [
        userId, userType,
        userId, userType,
        userId, userType,
        userId, userType,
        userId, userType,
        userId, userType
    ]);

    return contacts;
}


  static async getAllStaffForDM() {
    const [staff] = await db.query(`
      SELECT id, CONCAT(first_name, ' ', second_name) as name, email, image, 
        CASE WHEN is_active = TRUE THEN 'online' ELSE 'offline' END as status
      FROM staff
      WHERE is_active = TRUE
      ORDER BY first_name ASC
    `);
    return staff;
  }

  // ANNOUNCEMENTS
  
  static async getAllAnnouncements() {
    const [announcements] = await db.query(`
      SELECT a.*,
        CASE 
          WHEN a.posted_by_type = 'staff' THEN CONCAT(s.first_name, ' ', s.second_name)
          ELSE 'Admin'
        END as posted_by_name,
        (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id) as read_count
      FROM announcements a
      LEFT JOIN staff s ON a.posted_by_id = s.id AND a.posted_by_type = 'staff'
      WHERE a.is_active = TRUE
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY a.priority DESC, a.created_at DESC
    `);
    return announcements;
  }

  static async createAnnouncement(data) {
    const { title, content, priority, posted_by_id, posted_by_type, expires_at } = data;
    const [result] = await db.query(`
      INSERT INTO announcements (title, content, priority, posted_by_id, posted_by_type, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, content, priority || 'normal', posted_by_id, posted_by_type, expires_at || null]);
    return result.insertId;
  }

  static async deleteAnnouncement(announcementId) {
    await db.query(`
      UPDATE announcements SET is_active = FALSE WHERE id = ?
    `, [announcementId]);
    return true;
  }

  static async markAnnouncementAsRead(announcementId, userId, userType) {
    await db.query(`
      INSERT IGNORE INTO announcement_reads (announcement_id, user_id, user_type)
      VALUES (?, ?, ?)
    `, [announcementId, userId, userType]);
    return true;
  }

  // TYPING INDICATOR
  
  static async setTypingStatus(channelId, userId, userType, isTyping) {
    if (isTyping) {
      await db.query(`
        INSERT INTO typing_indicators (channel_id, user_id, user_type, is_typing)
        VALUES (?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE is_typing = TRUE, last_typed_at = CURRENT_TIMESTAMP
      `, [channelId, userId, userType]);
    } else {
      await db.query(`
        UPDATE typing_indicators 
        SET is_typing = FALSE 
        WHERE channel_id = ? AND user_id = ? AND user_type = ?
      `, [channelId, userId, userType]);
    }
    return true;
  }

  static async getTypingUsers(channelId) {
    const [users] = await db.query(`
      SELECT ti.*,
        CASE 
          WHEN ti.user_type = 'staff' THEN CONCAT(s.first_name, ' ', s.second_name)
          ELSE 'Admin'
        END as user_name
      FROM typing_indicators ti
      LEFT JOIN staff s ON ti.user_id = s.id AND ti.user_type = 'staff'
      WHERE ti.channel_id = ? 
        AND ti.is_typing = TRUE
        AND ti.last_typed_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    `, [channelId]);
    return users;
  }
}

module.exports = CommunicationModel;