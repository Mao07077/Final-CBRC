import { useState } from "react";
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
