import React from "react";
import { Mic, Video, Phone } from "lucide-react";

const SessionControls = ({ onLeaveSession, isMuted, setIsMuted, isCameraOff, setIsCameraOff }) => (
  <div className="w-full flex justify-center items-center gap-4 py-3 px-2 bg-gray-900 bg-opacity-95 border-t border-gray-700 sticky bottom-0 z-50">
    <button
      className={`rounded-full bg-blue-600 text-white p-3 mx-1 shadow-lg text-lg hover:bg-blue-700 transition-all ${isMuted ? 'opacity-60' : ''}`}
      style={{ minWidth: 48 }}
      onClick={() => setIsMuted((m) => !m)}
    >
      <Mic />
    </button>
    <button
      className={`rounded-full bg-blue-600 text-white p-3 mx-1 shadow-lg text-lg hover:bg-blue-700 transition-all ${isCameraOff ? 'opacity-60' : ''}`}
      style={{ minWidth: 48 }}
      onClick={() => setIsCameraOff((c) => !c)}
    >
      <Video />
    </button>
    <button
      className="rounded-full bg-red-600 text-white p-3 mx-1 shadow-lg text-lg hover:bg-red-700 transition-all"
      style={{ minWidth: 48 }}
      onClick={onLeaveSession}
    >
      <Phone />
    </button>
  </div>
);

export default SessionControls;
