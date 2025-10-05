import React, { useState } from "react";

const ChatPanel = ({ messages, onSend }) => {
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-2 bg-gray-100 rounded-xl mb-2">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">No messages yet.</div>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, idx) => (
              <li key={idx} className="bg-white rounded-lg shadow p-2 text-gray-800">
                <span className="font-bold text-blue-700 mr-2">{msg.sender}:</span>
                {msg.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-2 rounded-lg border border-gray-300"
          placeholder="Type a message..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;
