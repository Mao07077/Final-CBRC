import React from "react";
import useChatStore from "../../../../store/instructor/chatStore";

const ConversationList = () => {
  const { conversations, activeConversationId, setActiveConversation } =
    useChatStore();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-dark">Conversations</h2>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {Object.entries(conversations).map(([id, convo]) => (
          <li
            key={id}
            onClick={() => setActiveConversation(id)}
            className={`p-4 cursor-pointer hover:bg-gray-100 ${
              activeConversationId === id ? "bg-gray-200" : ""
            }`}
          >
            <p className="font-semibold text-gray-800">{convo.name}</p>
            <p className="text-sm text-gray-600 truncate">
              {convo.messages.length > 0
                ? convo.messages[convo.messages.length - 1].message
                : "No messages yet"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationList;
