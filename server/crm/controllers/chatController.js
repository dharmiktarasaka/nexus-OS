const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ChatAttachment = require('../models/ChatAttachment');

// @desc    Get all conversations & ensure Company Team Chat includes all users
// @route   GET /api/chat/conversations
const getConversations = async (req, res, next) => {
  try {
    const allUsers = await User.find({
      companyId: req.user.companyId,
      isActive: true
    }, { _id: 1 });

    const allUserIds = allUsers.map(u => u._id);

    // Auto-find or create the main Company Team Chat for all members
    let teamChat = await Conversation.findOne({
      companyId: req.user.companyId,
      type: 'GROUP',
      name: 'Company Team Chat'
    });

    if (!teamChat) {
      teamChat = await Conversation.create({
        companyId: req.user.companyId,
        type: 'GROUP',
        name: 'Company Team Chat',
        participants: allUserIds,
        createdBy: req.user._id,
        lastMessage: 'Welcome to Company Team Chat!'
      });
    } else {
      // Ensure all current company users are in the teamChat participants
      const currentParticipantSet = new Set(teamChat.participants.map(id => id.toString()));
      let updated = false;
      allUserIds.forEach(id => {
        if (!currentParticipantSet.has(id.toString())) {
          teamChat.participants.push(id);
          updated = true;
        }
      });
      if (updated) await teamChat.save();
    }

    const conversations = await Conversation.find({
      companyId: req.user.companyId,
      participants: req.user._id
    })
    .populate('participants', 'name email avatar role isActive')
    .sort({ lastMessageAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          isDeleted: false,
          readBy: { $ne: req.user._id }
        });
        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all active company users for direct chat with unread badges
// @route   GET /api/chat/users
const getCompanyDirectory = async (req, res, next) => {
  try {
    const users = await User.find({
      companyId: req.user.companyId,
      _id: { $ne: req.user._id },
      isActive: true
    }).select('name email avatar role isActive');

    // Attach direct unread counts for each teammate
    const usersWithUnread = await Promise.all(
      users.map(async (user) => {
        const directConv = await Conversation.findOne({
          companyId: req.user.companyId,
          type: 'DIRECT',
          participants: { $all: [req.user._id, user._id], $size: 2 }
        });

        let unreadCount = 0;
        if (directConv) {
          unreadCount = await Message.countDocuments({
            conversationId: directConv._id,
            sender: user._id,
            isDeleted: false,
            readBy: { $ne: req.user._id }
          });
        }

        const userObj = user.toObject();
        userObj.unreadCount = unreadCount;
        userObj.conversationId = directConv ? directConv._id : null;
        return userObj;
      })
    );

    res.json({
      success: true,
      users: usersWithUnread
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total unread messages count for current user
// @route   GET /api/chat/unread-count
const getUnreadChatCount = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.json({ success: true, totalUnread: 0 });
    }

    const userConversations = await Conversation.find({
      companyId: req.user.companyId,
      participants: req.user._id
    }, { _id: 1 });

    const conversationIds = userConversations.map(c => c._id);

    const totalUnread = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      sender: { $ne: req.user._id },
      isDeleted: false,
      readBy: { $ne: req.user._id }
    });

    res.json({
      success: true,
      totalUnread
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or find direct 1-on-1 or group conversation
// @route   POST /api/chat/conversations
const createConversation = async (req, res, next) => {
  try {
    const { participantIds, type = 'DIRECT', name = '' } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Participant user IDs are required' });
    }

    const allParticipants = Array.from(new Set([req.user._id.toString(), ...participantIds]));

    const validUsers = await User.find({
      _id: { $in: allParticipants },
      companyId: req.user.companyId,
      isActive: true
    });

    if (validUsers.length !== allParticipants.length) {
      return res.status(400).json({ success: false, message: 'One or more invalid or inactive users' });
    }

    if (type === 'DIRECT' && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        companyId: req.user.companyId,
        type: 'DIRECT',
        participants: { $all: allParticipants, $size: 2 }
      }).populate('participants', 'name email avatar role');

      if (existing) {
        return res.json({
          success: true,
          conversation: existing
        });
      }
    }

    const conversation = await Conversation.create({
      companyId: req.user.companyId,
      type: allParticipants.length > 2 ? 'GROUP' : type,
      name: name || (allParticipants.length > 2 ? 'Group Chat' : ''),
      participants: allParticipants,
      createdBy: req.user._id
    });

    const populated = await Conversation.findById(conversation._id).populate('participants', 'name email avatar role');

    res.status(201).json({
      success: true,
      conversation: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message history for conversation & mark as read
// @route   GET /api/chat/conversations/:id/messages
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Conversation not found or access denied' });
    }

    // Mark unread messages in this conversation as read by the current user
    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    const messages = await Message.find({
      conversationId: conversation._id,
      companyId: req.user.companyId
    })
    .populate('sender', 'name email avatar role')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation as read explicitly
// @route   POST /api/chat/conversations/:id/read
const markConversationAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Conversation not found' });
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message in conversation
// @route   POST /api/chat/conversations/:id/messages
const sendMessage = async (req, res, next) => {
  try {
    const { content = '', attachments = [] } = req.body;

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const message = await Message.create({
      companyId: req.user.companyId,
      conversationId: conversation._id,
      sender: req.user._id,
      content: content.trim(),
      attachments,
      readBy: [req.user._id]
    });

    const displayMsg = content.trim() || (attachments.length > 0 ? `📎 Sent ${attachments[0].fileType}` : 'New message');
    conversation.lastMessage = displayMsg;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMsg = await Message.findById(message._id).populate('sender', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: populatedMsg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload chat attachment file (Image, Video, Audio, Document)
// @route   POST /api/chat/upload
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let fileType = 'document';
    const mime = req.file.mimetype || 'application/octet-stream';

    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime.startsWith('video/')) fileType = 'video';
    else if (mime.startsWith('audio/')) fileType = 'audio';

    // Store directly in MongoDB Atlas for 100% persistence on cloud hosting (Render/Vercel)
    const attachmentDoc = await ChatAttachment.create({
      companyId: req.user.companyId,
      fileName: req.file.originalname,
      fileType,
      contentType: mime,
      fileSize: req.file.size || req.file.buffer.length,
      data: req.file.buffer
    });

    const sanitizedFilename = encodeURIComponent(req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    const fileUrl = `/api/chat/files/${attachmentDoc._id}/${sanitizedFilename}`;

    res.json({
      success: true,
      attachment: {
        _id: attachmentDoc._id,
        fileName: req.file.originalname,
        fileUrl,
        fileType,
        fileSize: req.file.size || req.file.buffer.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream or download chat attachment directly from MongoDB Atlas
// @route   GET /api/chat/files/:id/:filename?
const getAttachmentFile = async (req, res, next) => {
  try {
    const attachment = await ChatAttachment.findById(req.params.id);
    if (!attachment || !attachment.data) {
      return res.status(404).send('Attachment not found or expired');
    }

    res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', attachment.fileSize || attachment.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const isMedia = ['image', 'video', 'audio'].includes(attachment.fileType);
    const dispositionType = isMedia ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(attachment.fileName)}"`);

    return res.send(attachment.data);
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a text message (Only text-only messages can be edited)
// @route   PUT /api/chat/messages/:id
const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const message = await Message.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Deleted messages cannot be edited' });
    }

    // Check sender permission: sender must be current user
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own sent messages' });
    }

    // RULE: Only text messages can be edited (messages with NO media/file attachments)
    if (message.attachments && message.attachments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Media and document attachments cannot be edited. You can only delete document messages.'
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email avatar role');

    // Update conversation lastMessage if this is the latest message
    const lastMsgDoc = await Message.findOne({ conversationId: message.conversationId }).sort({ createdAt: -1 });
    if (lastMsgDoc && lastMsgDoc._id.toString() === message._id.toString()) {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: message.content
      });
    }

    res.json({
      success: true,
      message: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (Text or Document)
// @route   DELETE /api/chat/messages/:id
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check sender permission: sender or ADMIN
    const isOwner = message.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    message.attachments = [];
    await message.save();

    const populated = await Message.findById(message._id).populate('sender', 'name email avatar role');

    // Update conversation lastMessage if this was the latest message
    const lastMsgDoc = await Message.findOne({ conversationId: message.conversationId }).sort({ createdAt: -1 });
    if (lastMsgDoc && lastMsgDoc._id.toString() === message._id.toString()) {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: 'This message was deleted'
      });
    }

    res.json({
      success: true,
      message: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getCompanyDirectory,
  getUnreadChatCount,
  createConversation,
  getMessages,
  markConversationAsRead,
  sendMessage,
  uploadAttachment,
  getAttachmentFile,
  editMessage,
  deleteMessage
};
