import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "./Chat.css";

const API_BASE = "http://localhost:5000";

const QUICK_CHIPS = [
  "Is this price negotiable?",
  "Can you arrange transportation?",
  "What is the moisture level & quality?",
  "Are you ready for immediate dispatch?",
  "Can you share a sample batch?",
  "Let's finalize this trade deal!"
];

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipientParam = searchParams.get("recipientId");
  const cropParam = searchParams.get("cropId");

  const { socket, isConnected, isUserOnline, setUnreadCount, fetchUnreadCount } = useSocket();

  // User state from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState("");
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState({ price: "", quantity: "", unit: "quintal", cropTitle: "" });
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingConversations(true);
      const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        return data.conversations || [];
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    } finally {
      setLoadingConversations(false);
    }
    return [];
  }, [token]);

  // Handle URL deep-linking (?recipientId=...&cropId=...)
  useEffect(() => {
    const handleUrlTarget = async () => {
      const convList = await fetchConversations();
      if (recipientParam && token) {
        try {
          const res = await fetch(`${API_BASE}/api/chat/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              recipientId: recipientParam,
              cropId: cropParam || undefined
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.conversation) {
              setActiveConversation(data.conversation);
              // Prepopulate deal form with crop context if available
              if (data.conversation.crop) {
                setDealForm({
                  price: data.conversation.crop.expectedPrice || "",
                  quantity: data.conversation.crop.quantity || "",
                  unit: data.conversation.crop.unit || "quintal",
                  cropTitle: data.conversation.crop.cropName || ""
                });
              }
              // Refresh list
              fetchConversations();
            }
          }
        } catch (e) {
          console.error("Error opening target conversation:", e);
        }
      } else if (convList && convList.length > 0 && !activeConversation) {
        // Auto-select first conversation on desktop
        setActiveConversation(convList[0]);
      }
    };
    handleUrlTarget();
  }, [recipientParam, cropParam, token]);

  // 2. Fetch Messages when activeConversation changes
  useEffect(() => {
    if (!activeConversation || !token) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(
          `${API_BASE}/api/chat/conversations/${activeConversation._id}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom(false), 80);
        }

        // Mark as read
        await fetch(`${API_BASE}/api/chat/conversations/${activeConversation._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });

        // Reset unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
          )
        );
        fetchUnreadCount();
      } catch (e) {
        console.error("Error fetching messages:", e);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Setup crop deal defaults if attached
    if (activeConversation.crop) {
      setDealForm({
        price: activeConversation.crop.expectedPrice || "",
        quantity: activeConversation.crop.quantity || "",
        unit: activeConversation.crop.unit || "quintal",
        cropTitle: activeConversation.crop.cropName || ""
      });
    }

    // Join room in Socket.IO
    if (socket && isConnected) {
      socket.emit("join_conversation", activeConversation._id);
      socket.emit("mark_read", { conversationId: activeConversation._id });
    }

    return () => {
      if (socket && isConnected) {
        socket.emit("leave_conversation", activeConversation._id);
      }
    };
  }, [activeConversation?._id, socket, isConnected, token]);

  // 3. Socket event listeners for active chat
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      if (activeConversation && newMessage.conversationId === activeConversation._id) {
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => scrollToBottom(true), 50);

        // Mark as read immediately if current active window is open
        socket.emit("mark_read", { conversationId: activeConversation._id });
      }

      // Update conversations list preview
      setConversations((prev) => {
        return prev.map((c) => {
          if (c._id === newMessage.conversationId) {
            const isCurrentActive = activeConversation && c._id === activeConversation._id;
            return {
              ...c,
              lastMessage: {
                text: newMessage.text,
                sender: newMessage.sender,
                createdAt: newMessage.createdAt,
                read: isCurrentActive
              },
              unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });
      });
    };

    const handleUserTyping = ({ conversationId, userName }) => {
      if (activeConversation && conversationId === activeConversation._id) {
        setOtherUserTyping(true);
        setTypingUserName(userName || "Trader");
      }
    };

    const handleUserStopTyping = ({ conversationId }) => {
      if (activeConversation && conversationId === activeConversation._id) {
        setOtherUserTyping(false);
      }
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (activeConversation && conversationId === activeConversation._id) {
        setMessages((prev) =>
          prev.map((m) => (m.sender?._id === currentUser.id ? { ...m, read: true } : m))
        );
      }
    };

    const handleDealStatusUpdated = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("deal_status_updated", handleDealStatusUpdated);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("deal_status_updated", handleDealStatusUpdated);
    };
  }, [socket, activeConversation, currentUser.id]);

  // 4. Send Message Handler
  const handleSendMessage = (textToSend = inputText, messageType = "text", dealData = null) => {
    const text = (textToSend || "").trim();
    if (!text || !activeConversation) return;

    const recipientId = activeConversation.otherParticipant?._id;

    if (socket && isConnected) {
      socket.emit(
        "send_message",
        {
          conversationId: activeConversation._id,
          recipientId,
          text,
          messageType,
          dealData
        },
        (res) => {
          if (!res || !res.success) {
            // Fallback to REST API if socket callback reports issue
            sendViaRest(text, messageType, dealData);
          }
        }
      );
    } else {
      sendViaRest(text, messageType, dealData);
    }

    setInputText("");
    if (socket && isConnected) {
      socket.emit("stop_typing", { conversationId: activeConversation._id });
    }
  };

  const sendViaRest = async (text, messageType, dealData) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/chat/conversations/${activeConversation._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            text,
            messageType,
            dealData
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (e) {
      console.error("Error sending message via REST:", e);
    }
  };

  // Typing debounce emitter
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !isConnected || !activeConversation) return;

    socket.emit("typing", { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: activeConversation._id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // In-Chat Deal Response
  const handleDealResponse = (messageId, status) => {
    if (socket && isConnected) {
      socket.emit("respond_deal", { messageId, status }, (res) => {
        if (res && res.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? res.message : m))
          );
        }
      });
    }
  };

  // Submit Deal Proposal
  const handleProposeDealSubmit = (e) => {
    e.preventDefault();
    if (!dealForm.price || !dealForm.quantity) return;

    const price = parseFloat(dealForm.price);
    const qty = parseFloat(dealForm.quantity);
    const title = dealForm.cropTitle || activeConversation.crop?.cropName || "Crop";

    const text = `🤝 TRADE OFFER: Proposing ${qty} ${dealForm.unit} of ${title} at ₹${price} per ${dealForm.unit} (Total: ₹${(price * qty).toLocaleString("en-IN")})`;

    handleSendMessage(text, "deal_offer", {
      price,
      quantity: qty,
      unit: dealForm.unit,
      cropTitle: title,
      status: "pending"
    });

    setDealModalOpen(false);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const otherName = c.otherParticipant?.name || "";
    const otherBiz = c.otherParticipant?.businessName || "";
    const cropName = c.crop?.cropName || "";
    const matchSearch =
      otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherBiz.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cropName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "unread") return matchSearch && (c.unreadCount > 0);
    return matchSearch;
  });

  const dashboardRoute =
    currentUser.role === "buyer" ? "/buyer/dashboard" : "/farmer/dashboard";

  return (
    <div className="hl-chat-container">
      {/* =========================================
          LEFT SIDEBAR: CONVERSATION LIST
          ========================================= */}
      <aside
        className={`hl-chat-sidebar ${activeConversation ? "desktop-only" : ""}`}
      >
        <div className="hl-sidebar-header">
          <div className="hl-sidebar-top">
            <div
              className="hl-brand-title"
              onClick={() => navigate(dashboardRoute)}
              title="Return to Dashboard"
            >
              🌾 Human<span>Chat</span>
            </div>
            <button
              className="hl-back-home-btn"
              onClick={() => navigate(dashboardRoute)}
            >
              ← Dashboard
            </button>
          </div>

          <div className="hl-chat-search-wrap">
            <span className="hl-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search conversations, farmers, crops..."
              className="hl-chat-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="hl-chat-tabs">
          <button
            className={`hl-chat-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Traders ({conversations.length})
          </button>
          <button
            className={`hl-chat-tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread
          </button>
        </div>

        <div className="hl-conversations-list">
          {loadingConversations ? (
            <div className="hl-sidebar-empty">
              <div className="hl-sidebar-empty-icon">⏳</div>
              <p>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="hl-sidebar-empty">
              <div className="hl-sidebar-empty-icon">💬</div>
              <p>
                {searchQuery
                  ? "No matching conversations found."
                  : "No conversations yet. Connect with a farmer or buyer to start chatting!"}
              </p>
              <button
                className="hl-action-btn propose-btn"
                style={{ margin: "14px auto 0" }}
                onClick={() =>
                  navigate(
                    currentUser.role === "buyer"
                      ? "/buyer/marketplace"
                      : "/farmer/offers"
                  )
                }
              >
                {currentUser.role === "buyer"
                  ? "Browse Marketplace"
                  : "View Offers"}
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherParticipant || {};
              const online = isUserOnline(other._id);
              const isSelected = activeConversation?._id === conv._id;

              return (
                <div
                  key={conv._id}
                  className={`hl-conversation-item ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <div className="hl-avatar-wrap">
                    <div className={`hl-avatar ${other.role || "farmer"}`}>
                      {(other.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`hl-status-dot ${online ? "online" : "offline"}`}
                      title={online ? "Online" : "Offline"}
                    />
                  </div>

                  <div className="hl-conv-info">
                    <div className="hl-conv-name-row">
                      <span className="hl-conv-name">
                        {other.name || "Trader"}
                      </span>
                      {conv.lastMessage?.createdAt && (
                        <span className="hl-conv-time">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      )}
                    </div>

                    <div className="hl-conv-role-crop">
                      <span
                        className={`hl-role-pill ${
                          other.role === "buyer" ? "buyer" : "farmer"
                        }`}
                      >
                        {other.role === "buyer" ? "🏢 Buyer" : "🌾 Farmer"}
                      </span>
                      {conv.crop && (
                        <span className="hl-crop-pill">
                          🌾 {conv.crop.cropName}
                        </span>
                      )}
                    </div>

                    <div className="hl-conv-preview-row">
                      <span className="hl-conv-preview">
                        {conv.lastMessage?.text || "Started conversation"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="hl-unread-badge">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* =========================================
          RIGHT MAIN CHAT WINDOW
          ========================================= */}
      {activeConversation ? (
        <main className="hl-chat-main">
          {/* HEADER */}
          <header className="hl-chat-header">
            <div className="hl-header-user-info">
              <button
                className="hl-action-btn hl-back-btn-mobile"
                style={{ display: "none" }}
                onClick={() => setActiveConversation(null)}
              >
                ←
              </button>

              <div className="hl-avatar-wrap">
                <div
                  className={`hl-avatar ${
                    activeConversation.otherParticipant?.role || "farmer"
                  }`}
                >
                  {(activeConversation.otherParticipant?.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span
                  className={`hl-status-dot ${
                    isUserOnline(activeConversation.otherParticipant?._id)
                      ? "online"
                      : "offline"
                  }`}
                />
              </div>

              <div className="hl-header-details">
                <h3>
                  {activeConversation.otherParticipant?.name || "Trader"}
                  <span
                    className={`hl-role-pill ${
                      activeConversation.otherParticipant?.role === "buyer"
                        ? "buyer"
                        : "farmer"
                    }`}
                  >
                    {activeConversation.otherParticipant?.role === "buyer"
                      ? "🏢 Buyer"
                      : "🌾 Farmer"}
                  </span>
                </h3>

                <div className="hl-header-status-line">
                  {isUserOnline(activeConversation.otherParticipant?._id) ? (
                    <span className="hl-online-indicator">Online now</span>
                  ) : (
                    <span>Last active recently</span>
                  )}
                  {activeConversation.otherParticipant?.location?.district && (
                    <span>
                      • 📍 {activeConversation.otherParticipant.location.district},{" "}
                      {activeConversation.otherParticipant.location.state}
                    </span>
                  )}
                  {activeConversation.otherParticipant?.businessName && (
                    <span>
                      • 🏢 {activeConversation.otherParticipant.businessName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="hl-header-actions">
              {activeConversation.otherParticipant?.phone && (
                <a
                  href={`tel:${activeConversation.otherParticipant.phone}`}
                  className="hl-action-btn"
                  title="Direct Call"
                >
                  📞 {activeConversation.otherParticipant.phone}
                </a>
              )}

              <button
                className="hl-action-btn propose-btn"
                onClick={() => setDealModalOpen(true)}
              >
                🤝 Propose Deal
              </button>
            </div>
          </header>

          {/* CROP CONTEXT BANNER (IF LINKED) */}
          {activeConversation.crop && (
            <div className="hl-crop-context-banner">
              <div className="hl-banner-crop-details">
                <span className="hl-banner-badge">DISCUSSING LISTING</span>
                <strong>🌾 {activeConversation.crop.cropName}</strong>
                <span>
                  • Available: {activeConversation.crop.quantity}{" "}
                  {activeConversation.crop.unit}
                </span>
                <span>
                  • Expected Price: ₹{activeConversation.crop.expectedPrice} /{" "}
                  {activeConversation.crop.unit}
                </span>
                <span>
                  • 📍 {activeConversation.crop.district},{" "}
                  {activeConversation.crop.state}
                </span>
              </div>

              {currentUser.role === "buyer" && (
                <Link
                  to={`/buyer/crops/${activeConversation.crop._id}`}
                  style={{
                    color: "#15803d",
                    fontWeight: "700",
                    textDecoration: "none",
                    fontSize: "12px"
                  }}
                >
                  View Listing Details →
                </Link>
              )}
            </div>
          )}

          {/* MESSAGES FEED */}
          <div className="hl-messages-feed">
            {loadingMessages ? (
              <div className="hl-sidebar-empty">
                <div className="hl-sidebar-empty-icon">⏳</div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="hl-sidebar-empty">
                <div className="hl-sidebar-empty-icon">🌾</div>
                <p>
                  No messages yet. Say hello or tap a quick question below to
                  begin trade negotiation!
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isSent =
                  msg.sender?._id === currentUser.id ||
                  msg.sender === currentUser.id;

                return (
                  <div
                    key={msg._id || index}
                    className={`hl-message-row ${isSent ? "sent" : "received"}`}
                  >
                    {/* DEAL OFFER MESSAGE CARD */}
                    {msg.messageType === "deal_offer" && msg.dealData ? (
                      <div className="hl-deal-card">
                        <span className="hl-deal-badge">
                          🤝 DIRECT TRADE OFFER
                        </span>
                        <div className="hl-deal-title">
                          🌾 {msg.dealData.cropTitle || "Crop"} Deal Proposal
                        </div>

                        <div className="hl-deal-grid">
                          <div className="hl-deal-grid-item">
                            <small>Offered Rate</small>
                            <strong>
                              ₹{msg.dealData.price} / {msg.dealData.unit}
                            </strong>
                          </div>
                          <div className="hl-deal-grid-item">
                            <small>Quantity</small>
                            <strong>
                              {msg.dealData.quantity} {msg.dealData.unit}
                            </strong>
                          </div>
                          <div
                            className="hl-deal-grid-item"
                            style={{ gridColumn: "span 2" }}
                          >
                            <small>Total Trade Value</small>
                            <strong style={{ color: "#27ae60", fontSize: "17px" }}>
                              ₹
                              {(
                                msg.dealData.price * msg.dealData.quantity
                              ).toLocaleString("en-IN")}
                            </strong>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                        >
                          <span
                            className={`hl-deal-status-pill ${
                              msg.dealData.status || "pending"
                            }`}
                          >
                            {msg.dealData.status === "accepted"
                              ? "✅ Deal Accepted"
                              : msg.dealData.status === "rejected"
                              ? "✕ Declined"
                              : "⏳ Awaiting Response"}
                          </span>

                          {!isSent &&
                            (!msg.dealData.status ||
                              msg.dealData.status === "pending") && (
                              <div className="hl-deal-actions">
                                <button
                                  className="hl-deal-btn accept"
                                  onClick={() =>
                                    handleDealResponse(msg._id, "accepted")
                                  }
                                >
                                  Accept 🤝
                                </button>
                                <button
                                  className="hl-deal-btn decline"
                                  onClick={() =>
                                    handleDealResponse(msg._id, "rejected")
                                  }
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    ) : (
                      <div className="hl-message-bubble">{msg.text}</div>
                    )}

                    <div className="hl-message-meta">
                      <span>
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </span>
                      {isSent && (
                        <span
                          className={`hl-read-check ${
                            msg.read ? "read" : "sent"
                          }`}
                          title={msg.read ? "Read" : "Sent"}
                        >
                          {msg.read ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* TYPING INDICATOR */}
            {otherUserTyping && (
              <div className="hl-typing-row">
                <div className="hl-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>{typingUserName} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK CHIPS */}
          <div className="hl-quick-chips-bar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                className="hl-quick-chip"
                onClick={() => handleSendMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div className="hl-chat-input-bar">
            <button
              className="hl-action-btn"
              onClick={() => setDealModalOpen(true)}
              title="Send a structured deal proposal"
            >
              🤝 Offer
            </button>

            <div className="hl-chat-input-wrapper">
              <textarea
                rows={1}
                className="hl-chat-textarea"
                placeholder="Type a message or negotiation note... (Press Enter to send)"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              className="hl-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              title="Send Message"
            >
              ➤
            </button>
          </div>
        </main>
      ) : (
        /* NO ACTIVE CHAT PLACEHOLDER */
        <main className="hl-no-chat-selected">
          <div className="hl-no-chat-icon">🌾🤝🏢</div>
          <h2>HumanLink Direct Farmer-Buyer Chat</h2>
          <p>
            Connect directly in real time to negotiate crop prices, discuss
            quality, arrange transport, and seal profitable trade deals without
            middlemen.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="hl-action-btn propose-btn"
              onClick={() =>
                navigate(
                  currentUser.role === "buyer"
                    ? "/buyer/marketplace"
                    : "/farmer/crops"
                )
              }
            >
              {currentUser.role === "buyer"
                ? "Browse Marketplace Crops"
                : "Manage My Crops"}
            </button>
            <button
              className="hl-action-btn"
              onClick={() => navigate(dashboardRoute)}
            >
              Go to Dashboard
            </button>
          </div>
        </main>
      )}

      {/* =========================================
          PROPOSE TRADE DEAL MODAL
          ========================================= */}
      {dealModalOpen && (
        <div className="hl-modal-overlay">
          <div className="hl-modal-card">
            <div className="hl-modal-header">
              <h3>🤝 Propose Trade Deal</h3>
              <button
                className="hl-modal-close"
                onClick={() => setDealModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeDealSubmit}>
              <div className="hl-modal-body">
                <div className="hl-modal-field">
                  <label>Crop Name / Variety</label>
                  <input
                    type="text"
                    required
                    value={dealForm.cropTitle}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, cropTitle: e.target.value })
                    }
                    placeholder="e.g. Basmati Rice, Sharbati Wheat"
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px"
                  }}
                >
                  <div className="hl-modal-field">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={dealForm.quantity}
                      onChange={(e) =>
                        setDealForm({ ...dealForm, quantity: e.target.value })
                      }
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div className="hl-modal-field">
                    <label>Unit</label>
                    <select
                      value={dealForm.unit}
                      onChange={(e) =>
                        setDealForm({ ...dealForm, unit: e.target.value })
                      }
                    >
                      <option value="quintal">quintal</option>
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="bag">bag</option>
                    </select>
                  </div>
                </div>

                <div className="hl-modal-field">
                  <label>Offered Price (₹ per {dealForm.unit})</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={dealForm.price}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, price: e.target.value })
                    }
                    placeholder="e.g. 2400"
                  />
                </div>

                {dealForm.price && dealForm.quantity && (
                  <div className="hl-modal-total">
                    <span>Total Deal Value:</span>
                    <span>
                      ₹
                      {(
                        parseFloat(dealForm.price) *
                        parseFloat(dealForm.quantity)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              <div className="hl-modal-footer">
                <button
                  type="button"
                  className="hl-action-btn"
                  onClick={() => setDealModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hl-action-btn propose-btn"
                  disabled={!dealForm.price || !dealForm.quantity}
                >
                  Send Proposal ➤
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
