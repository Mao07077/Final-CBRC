
import React, { useState } from "react";
import useChatStore from "../../../../store/student/chatStore";
import { useChat } from "../../../../context/ChatProvider";
import useAuthStore from "../../../../store/authStore";
import messageService from "../../../../services/messageService";

const MessageInput = () => {
  const [text, setText] = useState("");
  const { activeConversationId, conversations } = useChatStore();
  const { sendMessage } = useChat();
  const { userData } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() && activeConversationId && conversations[activeConversationId]) {
      // Find recipient_id (the other user in the conversation)
      const convo = conversations[activeConversationId];
      const recipient_id = convo.user_id || convo.receiver_id || convo.participant_id || convo.id;
      const recipient_name = convo.name || convo.receiver_name || convo.participant_name;
      // 1. Send via WebSocket for real-time (must use recipient_id)
      sendMessage(activeConversationId, recipient_id, text);
      // 2. Save to DB via REST API (still use receiver_name)
      try {
        await messageService.sendMessage({
          sender_id: userData.id_number,
          receiver_name: recipient_name,
          message: text.trim(),
        });
      } catch (err) {
        // Optionally show error to user
        // eslint-disable-next-line no-console
        console.error("Failed to save message to DB", err);
      }
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
          className="form-input flex-1"
        />
        <button
          type="submit"
          className="btn btn-primary ml-4"
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
// import useChatStore from "../../../../store/student/chatStore";
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
//           className="form-input flex-1"
//         />
//         <button
//           type="submit"
//           className="btn btn-primary ml-4"
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// };
//
// export default MessageInput;
