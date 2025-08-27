import React, { useState } from "react";
import useChatStore from "../../../../store/student/chatStore";

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
