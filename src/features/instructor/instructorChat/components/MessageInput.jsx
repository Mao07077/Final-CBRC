import useChatStore from "../../../../store/instructor/chatStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const { sendMessage } = useChatStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText("");
    }
  };

  return (
    <div className="p-4 bg-white border-t">
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="ml-4 px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

// --- REFACTORED BELOW ---
// import React, { useState } from "react";
// import useChatStore from "../../../../store/instructor/chatStore";
// import { useChat } from "../../../../context/ChatProvider";
// import useAuthStore from "../../../../store/authStore";
//
// const MessageInput = () => {
//   const [text, setText] = useState("");
//   const { activeConversationId, conversations } = useChatStore();
//   const { sendMessage } = useChat();
//   const { userData } = useAuthStore();
//
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (text.trim() && activeConversationId && conversations[activeConversationId]) {
//       // Find recipient_id (the other user in the conversation)
//       const convo = conversations[activeConversationId];
//       const recipient_id = convo.user_id || convo.receiver_id || convo.participant_id;
//       sendMessage(activeConversationId, recipient_id, text);
//       setText("");
//     }
//   };
//
//   return (
//     <div className="p-4 bg-white border-t">
//       <form onSubmit={handleSubmit} className="flex items-center">
//         <input
//           type="text"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Type your message..."
//           className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
//         />
//         <button
//           type="submit"
//           className="ml-4 px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark"
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// };
//
// export default MessageInput;
