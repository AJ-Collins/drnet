const express = require("express");
const router = express.Router();
const CommunicationModel = require("../models/CommunicationModel");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get all channels
router.get("/channels", async (req, res) => {
  try {
    const channels = await CommunicationModel.getAllChannels();
    res.json({ success: true, channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create new channel (admin only)
router.post("/channels", async (req, res) => {
  try {
    const { name, description, channel_type } = req.body;
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';

    if (!name) {
      return res.status(400).json({ success: false, message: "Channel name required" });
    }

    const channelId = await CommunicationModel.createChannel({
      name,
      description,
      channel_type: channel_type || 'public',
      created_by_id: userId,
      created_by_type: userType
    });

    const io = req.app.get('socketio');
    io.emit('channelCreated', { channelId, name, description });

    res.json({ success: true, channelId, message: "Channel created" });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete channel (admin only)
router.delete("/channels/:id", async (req, res) => {
  try {
    await CommunicationModel.deleteChannel(req.params.id);
    
    const io = req.app.get('socketio');
    io.emit('channelDeleted', { channelId: req.params.id });

    res.json({ success: true, message: "Channel deleted" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// MESSAGES

// Get channel messages
router.get("/messages/channel/:channelId", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    const messages = await CommunicationModel.getChannelMessages(
      req.params.channelId, 
      userId, 
      userType
    );
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get direct messages
router.get("/messages/direct/:otherUserId/:otherUserType", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    const { otherUserId, otherUserType } = req.params;

    const messages = await CommunicationModel.getDirectMessages(
      userId, userType, 
      parseInt(otherUserId), otherUserType
    );
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send message (channel or direct) - FIXED
router.post("/messages", async (req, res) => {
  try {
    const { channel_id, recipient_id, recipient_type, message_type, content } = req.body;
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';

    if (!content || !message_type) {
      return res.status(400).json({ success: false, message: "Content and message type required" });
    }

    const message = await CommunicationModel.sendMessage({
      channel_id,
      sender_id: userId,
      sender_type: userType,
      recipient_id,
      recipient_type,
      message_type,
      content
    });

    // FIXED: Emit via Socket.IO with correct event names and data structure
    const io = req.app.get('socketio');
    
    if (message_type === 'channel') {
      // Emit global event for channel messages
      io.emit('newChannelMessage', { 
        channelId: channel_id, 
        message: {
          id: message.id,
          content: message.content,
          sender_id: userId,
          sender_type: userType,
          sender_name: req.session.user.first_name + ' ' + req.session.user.second_name,
          created_at: message.created_at || new Date().toISOString(),
          isFromMe: true
        }
      });
      
      console.log('✅ Emitted newChannelMessage for channel:', channel_id);
      
    }  else if (message_type === 'direct') {
      const messageData = {
          id: message.id,
          content: content,
          sender_id: userId,
          sender_type: userType,
          recipient_id: recipient_id,
          recipient_type: recipient_type,
          sender_name: req.session.user.first_name + ' ' + req.session.user.second_name,
          created_at: message.created_at || new Date().toISOString(),
          isFromMe: true
      };
      
      io.emit('newDirectMessage', { 
          message: messageData
      });
      
      console.log('✅ Emitted newDirectMessage:', messageData);
  }

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete message
router.delete("/messages/:id", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    await CommunicationModel.deleteMessage(req.params.id, userId, userType);
    
    const io = req.app.get('socketio');
    io.emit('messageDeleted', { messageId: req.params.id });

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark message as read
router.post("/messages/:id/read", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    await CommunicationModel.markMessageAsRead(req.params.id, userId, userType);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get unread count
router.get("/messages/unread/count", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    const count = await CommunicationModel.getUnreadCount(userId, userType);
    res.json({ success: true, unread_count: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DIRECT MESSAGE CONTACTS

// Get all DM contacts
router.get("/contacts", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    const contacts = await CommunicationModel.getDirectMessageContacts(userId, userType);
    res.json({ success: true, contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all staff (for starting new DM)
router.get("/staff", async (req, res) => {
  try {
    const staff = await CommunicationModel.getAllStaffForDM();
    res.json({ success: true, staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ANNOUNCEMENTS

// Get all announcements
router.get("/announcements", async (req, res) => {
  try {
    const announcements = await CommunicationModel.getAllAnnouncements();
    res.json({ success: true, announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create announcement (admin only)
router.post("/announcements", async (req, res) => {
  try {
    const { title, content, priority, expires_at } = req.body;
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content required" });
    }

    const announcementId = await CommunicationModel.createAnnouncement({
      title,
      content,
      priority: priority || 'normal',
      posted_by_id: userId,
      posted_by_type: userType,
      expires_at
    });

    const io = req.app.get('socketio');
    io.emit('newAnnouncement', { 
      announcementId, 
      title,
      content,
      priority: priority || 'normal'
    });

    res.json({ success: true, announcementId, message: "Announcement created" });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete announcement
router.delete("/announcements/:id", async (req, res) => {
  try {
    await CommunicationModel.deleteAnnouncement(req.params.id);
    
    const io = req.app.get('socketio');
    io.emit('announcementDeleted', { announcementId: req.params.id });

    res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark announcement as read
router.post("/announcements/:id/read", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';
    
    await CommunicationModel.markAnnouncementAsRead(req.params.id, userId, userType);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking announcement as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// TYPING INDICATORS - FIXED
router.post("/typing", async (req, res) => {
  try {
    const { channel_id, recipient_id, recipient_type, is_typing } = req.body;
    const userId = req.session.user.id;
    const userType = req.session.user.role_name === 'admin' ? 'admin' : 'staff';

    const io = req.app.get('socketio');
    
    if (channel_id) {
      // Channel typing
      await CommunicationModel.setTypingStatus(channel_id, userId, userType, is_typing);
      
      io.emit('userTyping', { 
        channelId: channel_id, 
        userId: userId,
        userName: req.session.user.first_name + ' ' + req.session.user.second_name,
        isTyping: is_typing 
      });
    } else if (recipient_id && recipient_type) {
      // Direct message typing
      io.emit('userTypingDM', {
        senderId: userId,
        senderType: userType,
        senderName: req.session.user.first_name + ' ' + req.session.user.second_name,
        recipientId: recipient_id,
        recipientType: recipient_type,
        isTyping: is_typing
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating typing status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;