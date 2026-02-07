const db = require("../config/db");

// --- Helper Function ---
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const SmsLogsModel = {

  /**
   * Check if a specific message type can be sent (48hr rate limit)
   * Returns true if allowed, false if blocked
   */
  async canSendMessageType(subscriptionId, messageType) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM sms_logs 
      WHERE subscription_id = ? 
      AND message_type = ?
      AND sent_at >= NOW() - INTERVAL 48 HOUR
    `;
    
    const [rows] = await db.execute(sql, [subscriptionId, messageType]);
    return rows[0].count === 0; // Returns true
  },

  /**
   * Get time remaining until next allowed message
   */
  async getTimeUntilNextAllowed(subscriptionId, messageType) {
    const sql = `
      SELECT sent_at 
      FROM sms_logs 
      WHERE subscription_id = ? 
      AND message_type = ?
      AND sent_at >= NOW() - INTERVAL 48 HOUR
      ORDER BY sent_at DESC 
      LIMIT 1
    `;
    
    const [rows] = await db.execute(sql, [subscriptionId, messageType]);
    
    if (rows.length === 0) {
      return null; // Can send now
    }
    
    const lastSent = new Date(rows[0].sent_at);
    const nextAllowed = new Date(lastSent.getTime() + 48 * 60 * 60 * 1000);
    const hoursRemaining = Math.ceil((nextAllowed - new Date()) / (1000 * 60 * 60));
    
    return { nextAllowed, hoursRemaining };
  },
  
  // Log a Single SMS
  async logSingle({ subscriptionId, phone, type, message }) {
    
    const timeStamp = toSqlDatetime(new Date());

    const sql = `
      INSERT INTO sms_logs (subscription_id, phone, message_type, message_body, sent_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [subscriptionId, phone, type, message, timeStamp]);
    return result.insertId;
  },

  // Log Bulk SMS
  async logBulk(logsArray) {
    if (!logsArray || logsArray.length === 0) return;

    const sql = `
      INSERT INTO sms_logs (subscription_id, phone, message_type, message_body, sent_at)
      VALUES ?
    `;
    
    const timeStamp = toSqlDatetime(new Date());

    const values = logsArray.map(item => [
        item.subscriptionId,
        item.phone,
        item.type || 'custom',
        item.message,
        timeStamp 
    ]);
    
    const [result] = await db.query(sql, [values]);
    return result;
  },

  // Get History
  async getHistory(subscriptionId) {
    const sql = `
      SELECT 
        id, 
        message_type, 
        message_body, 
        DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
        CASE 
            WHEN sent_at >= NOW() - INTERVAL 24 HOUR THEN 1 
            ELSE 0 
        END as is_recent
      FROM sms_logs 
      WHERE subscription_id = ? 
      ORDER BY sent_at DESC
    `;
    const [rows] = await db.execute(sql, [subscriptionId]);
    return rows;
  },

  // Get Dashboard Data (with 24h Counter)
  async getDashboardData() {
    const sql = `
      SELECT 
        us.id, 
        u.first_name, 
        u.second_name, 
        u.phone, 
        p.name as package_name, 
        p.price, 
        us.expiry_date,
        
        (
            SELECT COUNT(*) 
            FROM sms_logs sl 
            WHERE sl.subscription_id = us.id 
            AND sl.sent_at >= NOW() - INTERVAL 24 HOUR
        ) as sms_24h_count

      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN packages p ON us.package_id = p.id
      WHERE us.status = 'active' OR us.expiry_date > NOW()
    `;
    
    const [rows] = await db.query(sql);
    return rows;
  }
};

module.exports = SmsLogsModel;