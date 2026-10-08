import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  const socketRef = useRef(null);

  const token = localStorage.getItem("token");

  // Fetch unread count via REST
  const fetchUnreadCount = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/api/chat/unread-count`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    fetchUnreadCount();

    // Initialize socket connection
    const newSocket = io(SOCKET_SERVER_URL, {
      auth: { token: currentToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      // console.log("🟢 Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      // console.log("🔴 Socket disconnected");
      setIsConnected(false);
    });

    // Receive initial online users list
    newSocket.on("online_users_list", (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(new Set(users.map((u) => u.toString())));
      }
    });

    // Real-time status update for individual user
    newSocket.on("user_status_changed", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (isOnline) {
          updated.add(userId.toString());
        } else {
          updated.delete(userId.toString());
        }
        return updated;
      });
    });

    // Real-time notification for new incoming message
    newSocket.on("new_message_notification", (data) => {
      setUnreadCount((prev) => prev + 1);
      setLastNotification(data);

      // Play soft audio beep if available
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 587.33; // D5 note
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {
        // AudioContext not allowed without user interaction
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchUnreadCount]);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.has(userId.toString());
    },
    [onlineUsers]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        unreadCount,
        setUnreadCount,
        fetchUnreadCount,
        lastNotification,
        isUserOnline
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      unreadCount: 0,
      setUnreadCount: () => {},
      fetchUnreadCount: () => {},
      lastNotification: null,
      isUserOnline: () => false
    };
  }
  return context;
};

export default SocketContext;
