const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Crop = require("../models/Crop");
const { getIO, isUserOnline } = require("../services/socketService");

// ==========================================
// GET ALL CONVERSATIONS FOR CURRENT USER
// ==========================================
const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate("participants", "name email phone role businessName location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer", "quantity offeredPrice status")
            .populate("lastMessage.sender", "name role")
            .sort({ updatedAt: -1 });

        const formattedConversations = conversations.map((conv) => {
            const convObj = conv.toObject();
            const unread = conv.unreadCounts ? (conv.unreadCounts.get(userId.toString()) || 0) : 0;
            
            // Identify other participant
            const otherParticipant = conv.participants.find(
                (p) => p && p._id.toString() !== userId.toString()
            );

            return {
                ...convObj,
                unreadCount: unread,
                otherParticipant: otherParticipant
                    ? {
                          ...otherParticipant.toObject(),
                          isOnline: isUserOnline(otherParticipant._id)
                      }
                    : null
            };
        });

        res.status(200).json({
            success: true,
            conversations: formattedConversations
        });
    } catch (error) {
        console.error("getConversations error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching conversations"
        });
    }
};

// ==========================================
// GET OR CREATE CONVERSATION
// ==========================================
const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { recipientId, cropId, offerId, initialMessage } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: "recipientId is required"
            });
        }

        if (recipientId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot start a conversation with yourself"
            });
        }

        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) {
            return res.status(404).json({
                success: false,
                message: "Recipient user not found"
            });
        }

        // Check if a conversation between these two already exists
        const query = {
            participants: { $all: [userId, recipientId] }
        };
        if (cropId) {
            query.crop = cropId;
        }

        let conversation = await Conversation.findOne(query)
            .populate("participants", "name email phone role businessName location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer", "quantity offeredPrice status")
            .populate("lastMessage.sender", "name role");

        // If not found, also check without crop constraint if crop wasn't strictly found
        if (!conversation && cropId) {
            conversation = await Conversation.findOne({
                participants: { $all: [userId, recipientId] }
            })
                .populate("participants", "name email phone role businessName location")
                .populate("crop", "cropName cropType quantity unit expectedPrice state district")
                .populate("offer", "quantity offeredPrice status")
                .populate("lastMessage.sender", "name role");

            // Attach crop to existing conversation if none was linked
            if (conversation && !conversation.crop) {
                conversation.crop = cropId;
                await conversation.save();
            }
        }

        let isNew = false;
        if (!conversation) {
            isNew = true;
            const newConv = new Conversation({
                participants: [userId, recipientId],
                crop: cropId || null,
                offer: offerId || null,
                unreadCounts: new Map()
            });

            await newConv.save();

            conversation = await Conversation.findById(newConv._id)
                .populate("participants", "name email phone role businessName location")
                .populate("crop", "cropName cropType quantity unit expectedPrice state district")
                .populate("offer", "quantity offeredPrice status");
        }

        // If initialMessage was provided
        if (initialMessage && initialMessage.trim()) {
            const newMsg = await Message.create({
                conversationId: conversation._id,
                sender: userId,
                recipient: recipientId,
                text: initialMessage.trim(),
                read: false
            });

            conversation.lastMessage = {
                text: initialMessage.trim(),
                sender: userId,
                createdAt: newMsg.createdAt,
                read: false
            };

            const currentRecipientUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
            conversation.unreadCounts.set(recipientId.toString(), currentRecipientUnread + 1);
            await conversation.save();

            // Notify recipient via socket if online
            try {
                const io = getIO();
                const populatedMsg = await Message.findById(newMsg._id)
                    .populate("sender", "name role email phone")
                    .populate("recipient", "name role email phone");

                io.to(`conversation_${conversation._id}`).emit("receive_message", populatedMsg);
                io.to(`user_${recipientId}`).emit("new_message_notification", {
                    message: populatedMsg,
                    conversationId: conversation._id,
                    unreadCount: currentRecipientUnread + 1
                });
            } catch (sockErr) {
                // Socket notification non-blocking
            }
        }

        const convObj = conversation.toObject();
        const otherParticipant = conversation.participants.find(
            (p) => p && p._id.toString() !== userId.toString()
        );

        res.status(isNew ? 201 : 200).json({
            success: true,
            conversation: {
                ...convObj,
                unreadCount: conversation.unreadCounts ? (conversation.unreadCounts.get(userId.toString()) || 0) : 0,
                otherParticipant: otherParticipant
                    ? {
                          ...otherParticipant.toObject(),
                          isOnline: isUserOnline(otherParticipant._id)
                      }
                    : null
            }
        });
    } catch (error) {
        console.error("getOrCreateConversation error:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving or starting conversation"
        });
    }
};

// ==========================================
// GET CONVERSATION BY ID
// ==========================================
const getConversationById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const conversation = await Conversation.findById(id)
            .populate("participants", "name email phone role businessName location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer", "quantity offeredPrice status")
            .populate("lastMessage.sender", "name role");

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            (p) => p && p._id.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to view this conversation"
            });
        }

        const otherParticipant = conversation.participants.find(
            (p) => p && p._id.toString() !== userId.toString()
        );

        res.status(200).json({
            success: true,
            conversation: {
                ...conversation.toObject(),
                unreadCount: conversation.unreadCounts ? (conversation.unreadCounts.get(userId.toString()) || 0) : 0,
                otherParticipant: otherParticipant
                    ? {
                          ...otherParticipant.toObject(),
                          isOnline: isUserOnline(otherParticipant._id)
                      }
                    : null
            }
        });
    } catch (error) {
        console.error("getConversationById error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching conversation details"
        });
    }
};

// ==========================================
// GET MESSAGES FOR A CONVERSATION
// ==========================================
const getMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access to messages"
            });
        }

        const messages = await Message.find({ conversationId })
            .populate("sender", "name role email phone")
            .populate("recipient", "name role email phone")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        const totalMessages = await Message.countDocuments({ conversationId });

        res.status(200).json({
            success: true,
            messages,
            totalMessages,
            hasMore: totalMessages > skip + limit
        });
    } catch (error) {
        console.error("getMessages error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching messages"
        });
    }
};

// ==========================================
// SEND MESSAGE (REST API FALLBACK)
// ==========================================
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;
        const { text, messageType = "text", dealData } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message text is required"
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to send message in this conversation"
            });
        }

        const recipientId = conversation.participants.find(
            (p) => p.toString() !== userId.toString()
        );

        const newMessage = await Message.create({
            conversationId,
            sender: userId,
            recipient: recipientId,
            text: text.trim(),
            messageType,
            dealData: dealData || undefined,
            read: false
        });

        // Update conversation
        conversation.lastMessage = {
            text: text.trim(),
            sender: userId,
            createdAt: newMessage.createdAt,
            read: false
        };

        const currentRecipientUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
        conversation.unreadCounts.set(recipientId.toString(), currentRecipientUnread + 1);
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "name role email phone")
            .populate("recipient", "name role email phone");

        // Broadcast to socket if active
        try {
            const io = getIO();
            io.to(`conversation_${conversationId}`).emit("receive_message", populatedMessage);
            io.to(`user_${recipientId}`).emit("new_message_notification", {
                message: populatedMessage,
                conversationId,
                unreadCount: currentRecipientUnread + 1
            });
        } catch (sockErr) {
            // Non blocking
        }

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        console.error("sendMessage error:", error);
        res.status(500).json({
            success: false,
            message: "Error sending message"
        });
    }
};

// ==========================================
// MARK CONVERSATION AS READ
// ==========================================
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const readTime = new Date();
        const updateResult = await Message.updateMany(
            {
                conversationId,
                recipient: userId,
                read: false
            },
            {
                $set: { read: true, readAt: readTime }
            }
        );

        if (conversation.unreadCounts) {
            conversation.unreadCounts.set(userId.toString(), 0);
        }
        if (conversation.lastMessage && conversation.lastMessage.sender.toString() !== userId.toString()) {
            conversation.lastMessage.read = true;
        }
        await conversation.save();

        // Broadcast read receipt to room
        try {
            const io = getIO();
            io.to(`conversation_${conversationId}`).emit("messages_read", {
                conversationId,
                readerId: userId,
                readAt: readTime
            });
        } catch (sockErr) {
            // Non blocking
        }

        res.status(200).json({
            success: true,
            markedCount: updateResult.modifiedCount
        });
    } catch (error) {
        console.error("markAsRead error:", error);
        res.status(500).json({
            success: false,
            message: "Error marking messages as read"
        });
    }
};

// ==========================================
// GET GLOBAL UNREAD COUNT
// ==========================================
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const count = await Message.countDocuments({
            recipient: userId,
            read: false
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error("getUnreadCount error:", error);
        res.status(500).json({
            success: false,
            message: "Error calculating unread count"
        });
    }
};

// ==========================================
// SEARCH USERS TO CHAT WITH
// ==========================================
const searchChatUsers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { query, role } = req.query;

        // By default, farmers want to chat with buyers, buyers want to chat with farmers
        const targetRole = role || (userRole === "farmer" ? "buyer" : "farmer");

        const filter = {
            _id: { $ne: userId }
        };

        if (targetRole && targetRole !== "all") {
            filter.role = targetRole;
        }

        if (query && query.trim()) {
            filter.$or = [
                { name: { $regex: query.trim(), $options: "i" } },
                { businessName: { $regex: query.trim(), $options: "i" } },
                { "location.district": { $regex: query.trim(), $options: "i" } },
                { "location.state": { $regex: query.trim(), $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .select("name email phone role businessName businessType location")
            .limit(20);

        const usersWithStatus = users.map((u) => ({
            ...u.toObject(),
            isOnline: isUserOnline(u._id)
        }));

        res.status(200).json({
            success: true,
            users: usersWithStatus
        });
    } catch (error) {
        console.error("searchChatUsers error:", error);
        res.status(500).json({
            success: false,
            message: "Error searching chat users"
        });
    }
};

module.exports = {
    getConversations,
    getOrCreateConversation,
    getConversationById,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    searchChatUsers
};
