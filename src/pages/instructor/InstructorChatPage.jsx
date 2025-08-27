import React, { useEffect } from "react";
import ConversationList from "../../features/instructor/instructorChat/components/ConversationList";
import ChatWindow from "../../features/instructor/instructorChat/components/ChatWindow";
import useChatStore from "../../store/instructor/chatStore";

const InstructorChatPage = () => {
  const { conversations, activeConversationId, fetchConversations, isLoading, error } = useChatStore();
  const selectedConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* ConversationList Panel */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 md:flex-shrink-0 md:border-r md:border-gray-200 ${
          selectedConversation ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList />
      </div>

      {/* ChatWindow Panel */}
      <div className={`w-full ${selectedConversation ? "block" : "hidden md:block"}`}>
        {selectedConversation ? (
          <ChatWindow />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500">
            <h3 className="text-lg font-semibold">Select a conversation</h3>
            <p>Choose a conversation from the list to view the chat history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorChatPage;
