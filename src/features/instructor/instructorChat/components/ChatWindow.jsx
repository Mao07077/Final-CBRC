

import React, { useRef, useEffect, useState } from "react";
import useChatStore from "../../../../store/instructor/chatStore";
import useAuthStore from "../../../../store/authStore";
import { useChat } from "../../../../context/ChatProvider";
import messageService from "../../../../services/messageService";
import MessageInput from "./MessageInput";
import { FiArrowLeft } from 'react-icons/fi';


const ChatWindow = () => {


  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { userData } = useAuthStore();
  const { messages: wsMessages } = useChat();
  const [history, setHistory] = useState([]);
  const selectedConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;
  const endOfMessagesRef = useRef(null);

  // Fetch chat history when conversation changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (userData && selectedConversation) {
        const sender = userData.id_number;
        // Find the other user in the conversation
        let receiver = null;
        if (selectedConversation.user_id && selectedConversation.user_id !== sender) receiver = selectedConversation.user_id;
        else if (selectedConversation.receiver_id && selectedConversation.receiver_id !== sender) receiver = selectedConversation.receiver_id;
        else if (selectedConversation.participant_id && selectedConversation.participant_id !== sender) receiver = selectedConversation.participant_id;
        if (!receiver) {
          setHistory([]);
          return;
        }
        try {
          const msgs = await messageService.getMessages(sender, receiver);
          setHistory(msgs || []);
        } catch (e) {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    };
    fetchHistory();
  }, [activeConversationId, userData, selectedConversation]);

  // Merge backend and WebSocket messages, avoid duplicates by _id
  const chatMessages = React.useMemo(() => {
    const wsForThisChat = wsMessages.filter((msg) => msg.chat_id === activeConversationId);
    const all = [...history, ...wsForThisChat];
    const seen = new Set();
    return all.filter((msg) => {
      if (msg._id && seen.has(msg._id)) return false;
      if (msg._id) seen.add(msg._id);
      return true;
    });
  }, [history, wsMessages, activeConversationId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white flex items-center gap-4 flex-shrink-0">
        <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
            <FiArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h3 className="text-lg font-bold text-gray-800">{selectedConversation.name}</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {chatMessages.map((msg, index) => {
          const isFromCurrentUser = msg.sender_id === userData?.id_number;
          const justifyClass = isFromCurrentUser ? "justify-end" : "justify-start";
          const bubbleClass = isFromCurrentUser
            ? "bg-accent-medium text-white"
            : "bg-gray-200 text-gray-800";
          return (
            <div key={msg._id || index} className={`flex ${justifyClass} mb-4`}>
              <div className={`py-2 px-4 rounded-2xl max-w-sm ${bubbleClass}`}>
                <p>{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;

// --- REFACTORED BELOW ---
// import React, { useRef, useEffect } from "react";
// import useChatStore from "../../../../store/instructor/chatStore";
// import useAuthStore from "../../../../store/authStore";
// import { useChat } from "../../../../context/ChatProvider";
// import MessageInput from "./MessageInput";
// import { FiArrowLeft } from 'react-icons/fi';
//
// const ChatWindow = () => {
//   const { conversations, activeConversationId, setActiveConversation } = useChatStore();
//   const { userData } = useAuthStore();
//   const { messages, markAsSeen } = useChat();
//   const selectedConversation = activeConversationId
//     ? conversations[activeConversationId]
//     : null;
//   const endOfMessagesRef = useRef(null);
//
//   // Filter global messages for this conversation
//   const chatMessages = messages.filter(
//     (msg) => msg.chat_id === activeConversationId
//   );
//
//   useEffect(() => {
//     endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
//     // Mark as seen when viewing
//     if (chatMessages.length > 0) {
//       const lastMsg = chatMessages[chatMessages.length - 1];
//       if (lastMsg.sender_id !== userData?.id_number && !lastMsg.seen) {
//         markAsSeen(activeConversationId, lastMsg.sender_id);
//       }
//     }
//   }, [chatMessages, activeConversationId, userData, markAsSeen]);
//
//   if (!selectedConversation) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
//         <p>Select a conversation to start chatting.</p>
//       </div>
//     );
//   }
//
//   return (
//     <div className="flex-1 flex flex-col h-full bg-white">
//       {/* Chat Header */}
//       <div className="p-4 border-b bg-white flex items-center gap-4 flex-shrink-0">
//         <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
//             <FiArrowLeft className="h-6 w-6 text-gray-600" />
//         </button>
//         <h3 className="text-lg font-bold text-gray-800">{selectedConversation.name}</h3>
//       </div>
//
//       {/* Messages Area */}
//       <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
//         {chatMessages.map((msg, index) => {
//           const isFromCurrentUser = msg.sender_id === userData?.id_number;
//           const justifyClass = isFromCurrentUser ? "justify-end" : "justify-start";
//           const bubbleClass = isFromCurrentUser
//             ? "bg-accent-medium text-white"
//             : "bg-gray-200 text-gray-800";
//           return (
//             <div key={msg._id || index} className={`flex ${justifyClass} mb-4`}>
//               <div className={`py-2 px-4 rounded-2xl max-w-sm ${bubbleClass}`}>
//                 <p>{msg.message}</p>
//                 {isFromCurrentUser && (
//                   <span className="ml-2 text-xs text-gray-400">
//                     {msg.seen ? "Seen" : "Delivered"}
//                   </span>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//         <div ref={endOfMessagesRef} />
//       </div>
//
//       {/* Message Input */}
//       <div className="flex-shrink-0">
//         <MessageInput />
//       </div>
//     </div>
//   );
// };
//
// export default ChatWindow;
