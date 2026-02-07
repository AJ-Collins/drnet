// migrations/createCommunicationTables.js
const db = require("../config/db");

async function createCommunicationTables() {
  try {
    // 1. CHANNELS TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        channel_type ENUM('public', 'private') DEFAULT 'public',
        created_by_id INT NOT NULL,
        created_by_type ENUM('staff', 'admin') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active),
        INDEX idx_type (channel_type)
      );
    `);
    console.log("✓ Channels table created");

    // 2. CHANNEL MEMBERS TABLE (for private channels)
    await db.query(`
      CREATE TABLE IF NOT EXISTS channel_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id INT NOT NULL,
        user_id INT NOT NULL,
        user_type ENUM('staff', 'admin') NOT NULL,
        role ENUM('member', 'admin') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member (channel_id, user_id, user_type),
        INDEX idx_user (user_id, user_type)
      );
    `);
    console.log("✓ Channel Members table created");

    // 3. MESSAGES TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id INT NULL,
        sender_id INT NOT NULL,
        sender_type ENUM('staff', 'admin') NOT NULL,
        recipient_id INT NULL,
        recipient_type ENUM('staff', 'admin') NULL,
        message_type ENUM('channel', 'direct', 'announcement') NOT NULL DEFAULT 'channel',
        content TEXT NOT NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        parent_message_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL,
        INDEX idx_channel (channel_id, is_deleted),
        INDEX idx_direct (sender_id, recipient_id, message_type),
        INDEX idx_created (created_at DESC)
      );
    `);
    console.log("✓ Messages table created");

    // 4. MESSAGE READS TABLE (track who read what)
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        user_type ENUM('staff', 'admin') NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        UNIQUE KEY unique_read (message_id, user_id, user_type),
        INDEX idx_user_reads (user_id, user_type, read_at DESC)
      );
    `);
    console.log("✓ Message Reads table created");

    // 5. ANNOUNCEMENTS TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
        posted_by_id INT NOT NULL,
        posted_by_type ENUM('staff', 'admin') NOT NULL DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active, created_at DESC)
      );
    `);
    console.log("✓ Announcements table created");

    // 6. ANNOUNCEMENT READS TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        user_id INT NOT NULL,
        user_type ENUM('staff', 'admin') NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
        UNIQUE KEY unique_read (announcement_id, user_id, user_type)
      );
    `);
    console.log("✓ Announcement Reads table created");

    // 7. TYPING INDICATORS TABLE (real-time typing status)
    await db.query(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id INT NULL,
        user_id INT NOT NULL,
        user_type ENUM('staff', 'admin') NOT NULL,
        is_typing BOOLEAN DEFAULT FALSE,
        last_typed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        UNIQUE KEY unique_typing (channel_id, user_id, user_type),
        INDEX idx_channel_typing (channel_id, is_typing)
      );
    `);
    console.log("✓ Typing Indicators table created");

    // Insert default general channel
    await db.query(`
      INSERT IGNORE INTO channels (id, name, description, is_default, created_by_id, created_by_type)
      VALUES (1, 'General', 'Team-wide announcements and general discussion', TRUE, 1, 'admin');
    `);
    console.log("✓ Default General channel created");

    console.log("All communication tables created successfully");
  } catch (error) {
    console.error("Error creating communication tables:", error);
    throw error;
  }
}

module.exports = createCommunicationTables;