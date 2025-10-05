import React from "react";

const ParticipantsPanel = ({ participants }) => (
  <div className="w-full p-2 md:p-4 bg-white rounded-xl shadow mb-2 overflow-auto max-h-40 md:max-h-64">
    <h3 className="text-lg font-bold text-blue-700 mb-2">Participants</h3>
    <ul className="space-y-2">
      {participants.map((p) => (
        <li key={p.id} className="flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">{p.name[0]}</span>
          <span className="font-medium text-gray-800">{p.name}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default ParticipantsPanel;
