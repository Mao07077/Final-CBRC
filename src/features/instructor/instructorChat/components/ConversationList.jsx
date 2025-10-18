import React, { useEffect, useState } from "react";
import useChatStore from "../../../../store/instructor/chatStore";
import { useChat } from "../../../../context/ChatProvider";
import useStudentStore from "../../../../store/instructor/studentStore";

const ConversationList = () => {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { isUserOnline, unread } = useChat();
  const { students, filteredStudents, fetchStudents, searchStudents } = useStudentStore();
  const { createOrOpenConversation } = useChatStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    // preload students for search
    if (students.length === 0) fetchStudents();
  }, [students, fetchStudents]);

  useEffect(() => {
    // debounce search
    const t = setTimeout(() => {
      searchStudents(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, searchStudents]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-dark">Conversations</h2>
        <div className="mt-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name or ID"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          {query && filteredStudents.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto bg-white border rounded">
              {filteredStudents.map((s) => (
                <li
                  key={s.studentNo || s._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setQuery("");
                    createOrOpenConversation(s);
                  }}
                >
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.studentNo}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
