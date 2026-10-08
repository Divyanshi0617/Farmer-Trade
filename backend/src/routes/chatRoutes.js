const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    getConversations,
    getOrCreateConversation,
    getConversationById,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    searchChatUsers
} = require("../controllers/chatController");

// Protect all chat routes
router.use(protect);

// Unread count (placed before parameterized routes to avoid collision)
router.get("/unread-count", getUnreadCount);

// Search users to chat with
router.get("/users/search", searchChatUsers);

// Conversations
router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:id", getConversationById);

// Messages
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);

// Read receipts
router.put("/conversations/:conversationId/read", markAsRead);

module.exports = router;
