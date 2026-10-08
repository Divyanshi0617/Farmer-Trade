const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

let io = null;

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map();

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
                socket.handshake.query?.token;

            if (!token) {
                return next(new Error("Authentication required: token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.userId) {
                return next(new Error("Invalid token"));
            }

            const user = await User.findById(decoded.userId).select("-password");
            if (!user) {
                return next(new Error("User not found"));
            }

            socket.userId = user._id.toString();
            socket.userRole = user.role;
            socket.userName = user.name;
            socket.userData = user;

            next();
        } catch (err) {
            console.error("Socket authentication error:", err.message);
            next(new Error("Authentication failed: " + err.message));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;
        // console.log(`🟢 User connected: ${socket.userName} (${userId})`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
            // Broadcast user online to everyone
            io.emit("user_status_changed", { userId, isOnline: true });
        }
        onlineUsers.get(userId).add(socket.id);

        // Join personal user room for direct alerts & notifications
        socket.join(`user_${userId}`);

        // Send current list of online users to this socket
        socket.emit("online_users_list", Array.from(onlineUsers.keys()));

        // ==========================================
        // 1. JOIN CONVERSATION ROOM
        // ==========================================
        socket.on("join_conversation", async (conversationId) => {
            if (!conversationId) return;
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            // console.log(`User ${userId} joined room ${roomName}`);
        });

        // ==========================================
        // 2. LEAVE CONVERSATION ROOM
        // ==========================================
        socket.on("leave_conversation", (conversationId) => {
            if (!conversationId) return;
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);
        });

        // ==========================================
        // 3. SEND MESSAGE
        // ==========================================
        socket.on("send_message", async (data, callback) => {
            try {
                const {
                    conversationId,
                    recipientId,
                    text,
                    messageType = "text",
                    dealData
                } = data;

                if (!conversationId || !text || !recipientId) {
                    if (callback) callback({ success: false, message: "Missing required fields" });
                    return;
                }

                // Verify conversation and participation
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    if (callback) callback({ success: false, message: "Conversation not found" });
                    return;
                }

                const isParticipant = conversation.participants.some(
                    (p) => p.toString() === userId
                );
                if (!isParticipant) {
                    if (callback) callback({ success: false, message: "Unauthorized in this conversation" });
                    return;
                }

                // Create message
                const newMessage = await Message.create({
                    conversationId,
                    sender: userId,
                    recipient: recipientId,
                    text,
                    messageType,
                    dealData: dealData || undefined,
                    read: false
                });

                // Update conversation's last message & unread count
                conversation.lastMessage = {
                    text,
                    sender: userId,
                    createdAt: newMessage.createdAt,
                    read: false
                };

                const currentRecipientUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
                conversation.unreadCounts.set(recipientId.toString(), currentRecipientUnread + 1);
                await conversation.save();

                // Populate sender and recipient info
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("sender", "name role email phone")
                    .populate("recipient", "name role email phone");

                const roomName = `conversation_${conversationId}`;

                // Emit to conversation room (real-time message update)
                io.to(roomName).emit("receive_message", populatedMessage);

                // Notify recipient's personal room with notification & badge update
                io.to(`user_${recipientId}`).emit("new_message_notification", {
                    message: populatedMessage,
                    conversationId,
                    unreadCount: currentRecipientUnread + 1
                });

                if (callback) {
                    callback({ success: true, message: populatedMessage });
                }
            } catch (error) {
                console.error("Socket send_message error:", error);
                if (callback) callback({ success: false, message: error.message });
            }
        });

        // ==========================================
        // 4. TYPING INDICATORS
        // ==========================================
        socket.on("typing", ({ conversationId }) => {
            if (!conversationId) return;
            socket.to(`conversation_${conversationId}`).emit("user_typing", {
                conversationId,
                userId,
                userName: socket.userName
            });
        });

        socket.on("stop_typing", ({ conversationId }) => {
            if (!conversationId) return;
            socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
                conversationId,
                userId
            });
        });

        // ==========================================
        // 5. MARK MESSAGES AS READ
        // ==========================================
        socket.on("mark_read", async ({ conversationId }, callback) => {
            try {
                if (!conversationId) return;

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

                // Reset unread count for this user in the conversation
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.unreadCounts.set(userId, 0);
                    if (conversation.lastMessage && conversation.lastMessage.sender.toString() !== userId) {
                        conversation.lastMessage.read = true;
                    }
                    await conversation.save();
                }

                // Notify room that messages were read (so sender sees blue checks)
                io.to(`conversation_${conversationId}`).emit("messages_read", {
                    conversationId,
                    readerId: userId,
                    readAt: readTime
                });

                if (callback) callback({ success: true, count: updateResult.modifiedCount });
            } catch (err) {
                console.error("Socket mark_read error:", err);
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ==========================================
        // 6. DEAL NEGOTIATION INTERACTION
        // ==========================================
        socket.on("respond_deal", async ({ messageId, status }, callback) => {
            try {
                if (!["accepted", "rejected"].includes(status)) {
                    if (callback) callback({ success: false, message: "Invalid status" });
                    return;
                }

                const msg = await Message.findById(messageId);
                if (!msg || msg.messageType !== "deal_offer") {
                    if (callback) callback({ success: false, message: "Offer message not found" });
                    return;
                }

                // Only recipient can accept/reject the offer
                if (msg.recipient.toString() !== userId) {
                    if (callback) callback({ success: false, message: "Only recipient can respond to deal" });
                    return;
                }

                msg.dealData.status = status;
                await msg.save();

                const updatedMsg = await Message.findById(messageId)
                    .populate("sender", "name role email phone")
                    .populate("recipient", "name role email phone");

                io.to(`conversation_${msg.conversationId}`).emit("deal_status_updated", updatedMsg);

                if (callback) callback({ success: true, message: updatedMsg });
            } catch (err) {
                console.error("Socket respond_deal error:", err);
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ==========================================
        // 7. CHECK ONLINE STATUS
        // ==========================================
        socket.on("check_online_status", (targetUserIds, callback) => {
            if (!Array.isArray(targetUserIds)) return;
            const statusMap = {};
            targetUserIds.forEach((id) => {
                statusMap[id] = onlineUsers.has(id.toString()) && onlineUsers.get(id.toString()).size > 0;
            });
            if (callback) callback(statusMap);
        });

        // ==========================================
        // 8. DISCONNECT
        // ==========================================
        socket.on("disconnect", () => {
            // console.log(`🔴 User disconnected: ${socket.userName} (${userId})`);
            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    // Broadcast user offline
                    io.emit("user_status_changed", { userId, isOnline: false });
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const isUserOnline = (userId) => {
    return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

module.exports = {
    initSocket,
    getIO,
    isUserOnline
};
