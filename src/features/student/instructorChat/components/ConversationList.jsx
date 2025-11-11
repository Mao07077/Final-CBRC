import React from "react";
import useChatStore from "../../../../store/student/chatStore";
import { useChat } from "../../../../context/ChatProvider";

const ConversationList = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
  } = useChatStore();

  const conversationArray = Object.entries(conversations);
  const { isUserOnline, unread, messages, lastSeenText } = useChat();

  // helper to get latest preview text merging websocket messages
  const getLastMessageText = (id, convo) => {
    const wsForChat = messages.filter(m => m.chat_id === id);
    const lastFromWs = wsForChat.length ? wsForChat[wsForChat.length - 1] : null;
    const lastFromConvo = (convo.messages && convo.messages.length) ? convo.messages[convo.messages.length - 1] : null;
    const last = [lastFromConvo, lastFromWs]
      .filter(Boolean)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .pop();
    return last ? last.message : "No messages yet";
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-dark">Conversations</h2>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {conversationArray.map(([id, convo]) => {
          const online = isUserOnline(convo.user_id);
          const hasUnread = unread && unread[id];
          return (
            <li
              key={id}
              onClick={() => setActiveConversation(id)}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                activeConversationId === id ? "bg-gray-200" : ""
              }`}
              title={lastSeenText(convo.user_id)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
                  aria-label={lastSeenText(convo.user_id)}
                  title={lastSeenText(convo.user_id)}
                ></span>
                <p className="font-semibold text-gray-800">{convo.name}</p>
                {hasUnread && <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2">New</span>}
              </div>
              <p className="text-sm text-gray-600 truncate">{getLastMessageText(id, convo)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ConversationList;