import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatProvider';
import useAuthStore from '../../store/authStore';
import { X } from 'lucide-react';

// Lightweight in-app notification for new chat messages (like Facebook toast)
const InAppChatNotification = () => {
  const { messages } = useChat() || { messages: [] };
  const { userRole, isAuthenticated } = useAuthStore();
  const [toasts, setToasts] = useState([]);
  const lastIdRef = useRef(null);
  const navigate = useNavigate();

  // Show toast for the latest incoming chat message (not from self)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!messages || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    const key = latest?.id || latest?._id || `${latest.chat_id}-${latest.timestamp || Date.now()}`;
    if (lastIdRef.current === key) return;
    lastIdRef.current = key;
    try {
      // Only show toast for messages from others
      const userId = useAuthStore.getState()?.userData?.id_number;
      if (latest?.sender_id && userId && latest.sender_id === userId) return;
      if (!latest?.message) return;
      const title = latest.sender_name || 'New message';
      setToasts((prev) => [{
        id: key,
        title,
        body: latest.message.length > 120 ? latest.message.slice(0, 117) + '…' : latest.message,
        chatId: latest.chat_id,
      }, ...prev].slice(0, 3)); // keep max 3
    } catch {}
  }, [messages, isAuthenticated]);

  const closeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  const goToChat = (id) => {
    const base = userRole === 'instructor' ? '/instructor/messages' : '/student/messages';
    navigate(base);
    // optionally: pass chat_id via state/query if needed
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="bg-white border border-gray-200 shadow-xl rounded-lg p-3">
          <div className="flex items-start">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-semibold text-gray-800 truncate">{t.title}</div>
              <div className="text-sm text-gray-600 mt-0.5 line-clamp-3">{t.body}</div>
              <button
                onClick={() => goToChat(t.id)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View message
              </button>
            </div>
            <button
              onClick={() => closeToast(t.id)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InAppChatNotification;
