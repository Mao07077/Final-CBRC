import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import useAuthStore from "../store/authStore";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const WS_URL = "wss://final-cbrc.onrender.com/ws/chat";

const notificationAudio = typeof Audio !== 'undefined' ? new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg') : null;

export const ChatProvider = ({ children }) => {
  const { userData, isAuthenticated, userRole } = useAuthStore();
  const wsRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]); // [{chat_id, sender_id, recipient_id, message, ...}]
  const [unread, setUnread] = useState({}); // {chat_id: true}

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated || !userData?.id_number) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        user_id: userData.id_number,
        user_name: userData.firstname || "User"
      }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "presence") {
        setOnlineUsers(msg.online_users);
      } else if (msg.type === "chat_message") {
        setMessages((prev) => [...prev, msg]);
        // Play sound and show notification if not from self
        if (msg.sender_id !== userData.id_number) {
          if (notificationAudio) notificationAudio.play();
          if (Notification && Notification.permission === "granted") {
            new Notification(`New message from ${msg.sender_name}`, {
              body: msg.message
            });
          }
          setUnread((prev) => ({ ...prev, [msg.chat_id]: true }));
        }
      } else if (msg.type === "seen") {
        // Update message status to seen
        setMessages((prev) => prev.map(m => m.chat_id === msg.chat_id ? { ...m, seen: true } : m));
      }
    };
    ws.onclose = () => {
      wsRef.current = null;
    };
    return () => {
      ws.close();
    };
  }, [isAuthenticated, userData]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
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
  const isUserOnline = (id) => onlineUsers.includes(id);

  return (
    <ChatContext.Provider value={{
      onlineUsers,
      messages,
      unread,
      sendMessage,
      markAsSeen,
      isUserOnline,
      userType: userRole // 'student' or 'instructor'
    }}>
      {children}
    </ChatContext.Provider>
  );
};
