import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import useAuthStore from "../store/authStore";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const WS_URL = "wss://final-cbrc.onrender.com/ws/chat";

const notificationAudio = typeof Audio !== 'undefined' ? new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg') : null;

export const ChatProvider = ({ children }) => {
  const { userData, isAuthenticated, userRole } = useAuthStore();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [onlineUsers, setOnlineUsers] = useState([]); // raw ids
  const presenceMapRef = useRef({}); // { user_id: lastSeenTimestamp }
  const [messages, setMessages] = useState([]); // [{chat_id, sender_id, recipient_id, message, ...}]
  const [unread, setUnread] = useState({}); // {chat_id: true}
  const [typingMap, setTypingMap] = useState({}); // { chat_id: { user_id: true } }
  // Tick state to refresh "last seen" relative time tooltips periodically
  const [presenceTick, setPresenceTick] = useState(0);

  // Internal connect with auto-reconnect and heartbeat
  const connect = () => {
    if (!isAuthenticated || !userData?.id_number) return;
    // Clear any pending reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      reconnectAttemptsRef.current = 0; // reset backoff
      // Identify user
      try {
        ws.send(JSON.stringify({
          user_id: userData.id_number,
          user_name: userData.firstname || "User"
        }));
      } catch {}
      // Start heartbeat to keep connection alive
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        try { wsRef.current?.send(JSON.stringify({ type: "ping" })); } catch {}
      }, 20000);
    };
    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === "presence") {
        setOnlineUsers(msg.online_users || []);
        const nowTs = Date.now();
        (msg.online_users || []).forEach(uid => { presenceMapRef.current[uid] = nowTs; });
      } else if (msg.type === "chat_message") {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender_id !== userData.id_number) {
          if (notificationAudio) notificationAudio.play();
          if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            try { new Notification(`New message from ${msg.sender_name}`, { body: msg.message }); } catch {}
          }
          setUnread((prev) => ({ ...prev, [msg.chat_id]: true }));
        }
      } else if (msg.type === "seen") {
        setMessages((prev) => prev.map(m => m.chat_id === msg.chat_id ? { ...m, seen: true } : m));
      } else if (msg.type === "typing") {
        // msg: { type: 'typing', chat_id, user_id, isTyping }
        setTypingMap(prev => {
          const current = { ...(prev[msg.chat_id] || {}) };
          if (msg.isTyping) {
            current[msg.user_id] = true;
          } else {
            delete current[msg.user_id];
          }
          return { ...prev, [msg.chat_id]: current };
        });
      } else if (msg.type === "pong") {
        // no-op
      }
    };
    const scheduleReconnect = () => {
      wsRef.current = null;
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      // Exponential backoff up to 30s
      const attempt = Math.min(reconnectAttemptsRef.current + 1, 6);
      reconnectAttemptsRef.current = attempt;
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
    ws.onerror = () => scheduleReconnect();
    ws.onclose = () => scheduleReconnect();
  };

  // Manage connection lifecycle
  useEffect(() => {
    if (isAuthenticated && userData?.id_number) {
      connect();
      return () => {
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
        if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
        try { wsRef.current?.close(); } catch {}
        wsRef.current = null;
      };
    } else {
      // Not authenticated; ensure closed
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    }
  }, [isAuthenticated, userData]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Periodically tick to refresh relative "last seen" calculations in consumers
  useEffect(() => {
    const interval = setInterval(() => setPresenceTick((t) => t + 1), 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  // Send chat message
  const sendMessage = (chat_id, recipient_id, message) => {
    if (!wsRef.current || !userData?.id_number) return;
    wsRef.current.send(JSON.stringify({
      type: "chat_message",
      chat_id,
      sender_id: userData.id_number,
      sender_name: userData.firstname || "User",
      recipient_id,
      message
    }));
    setUnread((prev) => ({ ...prev, [chat_id]: false }));
  };

  // Typing indicator: call when local user types
  const sendTyping = (chat_id, isTyping, recipient_id) => {
    if (!wsRef.current || !userData?.id_number) return;
    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        chat_id,
        user_id: userData.id_number,
        isTyping: !!isTyping,
        recipient_id
      }));
    } catch {}
  };

  // Mark as seen
  const markAsSeen = (chat_id, sender_id) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: "seen",
      chat_id,
      sender_id
    }));
    setUnread((prev) => ({ ...prev, [chat_id]: false }));
  };

  // Get online status
  // Consider user online if presence within last 60s (fallback to list if missing)
  const isUserOnline = (id) => {
    if (onlineUsers.includes(id)) return true;
    const lastSeen = presenceMapRef.current[id];
    if (!lastSeen) return false;
    return (Date.now() - lastSeen) < 60000; // 60s threshold
  };

  // Human-friendly relative time for last seen
  const lastSeenText = (id) => {
    if (isUserOnline(id)) return "Online";
    const ts = presenceMapRef.current[id];
    if (!ts) return "Offline";
    const diff = Math.max(0, Date.now() - ts);
    const s = Math.floor(diff / 1000);
    if (s < 5) return "Last seen just now";
    if (s < 60) return `Last seen ${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `Last seen ${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Last seen ${h}h ago`;
    const d = Math.floor(h / 24);
    return `Last seen ${d}d ago`;
  };

  return (
    <ChatContext.Provider value={{
      onlineUsers,
      messages,
      unread,
      sendMessage,
        sendTyping,
      markAsSeen,
      isUserOnline,
      userType: userRole // 'student' or 'instructor'
        , typingMap,
      lastSeenText
    }}>
      {children}
    </ChatContext.Provider>
  );
};
