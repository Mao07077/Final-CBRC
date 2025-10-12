
import React, { useState, useMemo } from "react";

// Card color palette
const CARD_COLORS = [
  "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600",
  "bg-gradient-to-br from-green-200 via-green-400 to-green-600",
  "bg-gradient-to-br from-blue-200 via-blue-400 to-blue-600",
  "bg-gradient-to-br from-pink-200 via-pink-400 to-pink-600",
  "bg-gradient-to-br from-purple-200 via-purple-400 to-purple-600",
  "bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600",
  "bg-gradient-to-br from-teal-200 via-teal-400 to-teal-600",
  "bg-gradient-to-br from-red-200 via-red-400 to-red-600",
];

const getRandomColor = (seed) => {
  // Deterministic color per card (based on question hash)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

const Flashcard = ({ card, stacked = false, stackIndex = 0 }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  // Memoize color for this card
  const cardColor = useMemo(() => getRandomColor(card.question || ""), [card.question]);

  // Stacked effect: offset and scale for background cards
  const stackStyle = stacked
    ? {
        transform: `translateY(${stackIndex * 10}px) scale(${1 - stackIndex * 0.04})`,
        zIndex: 10 - stackIndex,
        filter: stackIndex > 0 ? "blur(1.5px) brightness(0.95)" : "none",
        opacity: stackIndex > 0 ? 0.7 : 1,
        pointerEvents: stackIndex > 0 ? "none" : "auto",
      }
    : {};

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative w-full max-w-md h-80 perspective-1000 select-none"
        style={stackStyle}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className={`absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu hover:scale-105 transition-all`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            <span className="uppercase tracking-widest text-xs text-gray-700/80 mb-2">Question</span>
            <p className="text-2xl text-center text-gray-900 font-bold drop-shadow-lg mb-4 font-mono">{card.question}</p>
            <button
              className="mt-4 px-4 py-2 bg-white/80 text-gray-800 font-semibold rounded-full shadow hover:bg-white transition-all"
              onClick={e => { e.stopPropagation(); setIsFlipped(true); }}
            >
              Flip to Answer
            </button>
          </div>
          {/* Back */}
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu hover:scale-105 transition-all`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            <span className="uppercase tracking-widest text-xs text-gray-700/80 mb-2">Answer</span>
            <p className="text-xl text-center text-gray-900 font-bold drop-shadow-lg font-mono">{card.answer}</p>
            <button
              className="mt-4 px-4 py-2 bg-white/80 text-gray-800 font-semibold rounded-full shadow hover:bg-white transition-all"
              onClick={e => { e.stopPropagation(); setIsFlipped(false); }}
            >
              Flip to Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
