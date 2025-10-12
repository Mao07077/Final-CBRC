
import React, { useState } from "react";

const Flashcard = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative w-full max-w-md h-80 perspective-1000 select-none"
      >
        <div
          className={`absolute w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-3xl shadow-2xl border-4 border-white transform-gpu hover:scale-105 transition-all">
            <span className="uppercase tracking-widest text-xs text-white/80 mb-2">Question</span>
            <p className="text-2xl text-center text-white font-bold drop-shadow-lg mb-4 font-mono">{card.question}</p>
            <button
              className="mt-4 px-4 py-2 bg-white/80 text-blue-700 font-semibold rounded-full shadow hover:bg-white transition-all"
              onClick={e => { e.stopPropagation(); setIsFlipped(true); }}
            >
              Flip to Answer
            </button>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-3xl shadow-2xl border-4 border-white transform-gpu hover:scale-105 transition-all">
            <span className="uppercase tracking-widest text-xs text-white/80 mb-2">Answer</span>
            <p className="text-xl text-center text-white font-bold drop-shadow-lg font-mono">{card.answer}</p>
            <button
              className="mt-4 px-4 py-2 bg-white/80 text-pink-700 font-semibold rounded-full shadow hover:bg-white transition-all"
              onClick={e => { e.stopPropagation(); setIsFlipped(false); }}
            >
              Flip to Question
            </button>
          </div>
        </div>
      </div>
      {/* Progress bar or fun accent */}
      <div className="w-32 h-2 mt-6 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-70 animate-pulse"></div>
    </div>
  );
};

export default Flashcard;
