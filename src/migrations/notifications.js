const db = require("../config/db");

async function createNotificationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(100) NOT NULL COMMENT 'Type: announcement, task, report, system, etc',
      reference_id INT NULL COMMENT 'ID of related entity (task_id, announcement_id, etc)',
      title VARCHAR(255) NOT NULL COMMENT 'Notification title',
      message TEXT NOT NULL COMMENT 'Notification message body',
      role_id INT NOT NULL COMMENT 'Role that can access this notification (REQUIRED)',
      user_id INT NULL COMMENT 'Specific user (NULL = all users in role)',
      is_read BOOLEAN DEFAULT FALSE COMMENT 'Read status per user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Foreign Keys
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES staff(id) ON DELETE CASCADE,
      
      -- Indexes for performance
      INDEX idx_role_user_read (role_id, user_id, is_read),
      INDEX idx_user_read (user_id, is_read),
      INDEX idx_role_read (role_id, is_read),
      INDEX idx_created_desc (created_at DESC),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Role-gated notifications system';
  `);
  
  console.log("Notifications table created successfully");
}

module.exports = createNotificationsTable;