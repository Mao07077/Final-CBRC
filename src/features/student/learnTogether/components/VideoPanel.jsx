import React from "react";

const VideoPanel = ({ participants }) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center w-full h-full p-2 md:p-4 overflow-auto">
      {participants.map((p) => (
        <div key={p.id} className="bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center w-40 h-40 md:w-56 md:h-56">
          {/* Replace with actual video stream if available */}
          <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-700 rounded-full flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">{p.name[0]}</span>
          </div>
          <span className="text-white text-sm md:text-base font-semibold">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

export default VideoPanel;
