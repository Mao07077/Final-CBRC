import React from "react";
import useChatStore from "../../../../store/instructor/chatStore";
import { useChat } from "../../../../context/ChatProvider";

const ConversationList = () => {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { isUserOnline, unread } = useChat();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-dark">Conversations</h2>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {Object.entries(conversations).map(([id, convo]) => {
          // Try to get the user id for online status (student id)
          const userId = convo.user_id || convo.student_id || id;
          const online = isUserOnline(userId);
          const hasUnread = unread && unread[id];
          return (
            <li
              key={id}
              onClick={() => setActiveConversation(id)}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                activeConversationId === id ? "bg-gray-200" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}></span>
                <p className="font-semibold text-gray-800">{convo.name}</p>
                {hasUnread && <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2">New</span>}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {convo.messages.length > 0
                  ? convo.messages[convo.messages.length - 1].message
                  : "No messages yet"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ConversationList;
