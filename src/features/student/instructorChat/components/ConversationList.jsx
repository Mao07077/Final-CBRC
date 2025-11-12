import React, { useEffect, useMemo, useState } from "react";
import useChatStore from "../../../../store/student/chatStore";
import { useChat } from "../../../../context/ChatProvider";
import messageService from "../../../../services/messageService";

const ConversationList = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createOrOpenConversation,
  } = useChatStore();

  const conversationArray = Object.entries(conversations);
  const { isUserOnline, unread, messages, lastSeenText } = useChat();
  const [query, setQuery] = useState("");
  const [allInstructors, setAllInstructors] = useState([]);

  // Load all instructors once for search; list renders only active conversations
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await messageService.getInstructors();
        if (mounted) setAllInstructors(list || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allInstructors.filter((i) => {
      const name = `${i.firstname || ""} ${i.lastname || ""}`.trim().toLowerCase();
      const idn = (i.id_number || "").toLowerCase();
      return name.includes(q) || idn.includes(q);
    }).slice(0, 10);
  }, [query, allInstructors]);

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
        <div className="mt-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search instructors by name or ID"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          {query && filtered.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto bg-white border rounded">
              {filtered.map((ins) => (
                <li
                  key={ins.id_number}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setQuery("");
                    createOrOpenConversation(ins);
                  }}
                >
                  <div className="text-sm font-medium">{`${ins.firstname} ${ins.lastname}`.trim()}</div>
                  <div className="text-xs text-gray-500">{ins.id_number}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
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