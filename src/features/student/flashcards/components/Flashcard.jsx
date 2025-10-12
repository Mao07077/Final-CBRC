
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

const Flashcard = ({ card, stacked = false, stackIndex = 0, peek = false, portrait = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardColor = useMemo(() => getRandomColor(card.question || ""), [card.question]);
  // For peeking cards, don't allow flipping and reduce brightness
  const isPeek = peek;
  const isPortrait = portrait || !peek;
  const stackStyle = stacked
    ? {
        transform: `translateY(${stackIndex * 10}px) scale(${1 - stackIndex * 0.04})`,
        zIndex: 10 - stackIndex,
        filter: stackIndex > 0 ? "blur(1.5px) brightness(0.95)" : "none",
        opacity: stackIndex > 0 ? 0.7 : 1,
        pointerEvents: stackIndex > 0 ? "none" : "auto",
      }
    : {};

  // Flip card only when the card is clicked (not on hover or button)
  const handleCardClick = () => {
    if (!isPeek) setIsFlipped(f => !f);
  };

  // Portrait aspect ratio for main card, slightly smaller for peeking
  const cardWidth = isPortrait ? '340px' : '320px';
  const cardHeight = isPortrait ? '480px' : '440px';

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`relative select-none cursor-pointer ${isPeek ? 'pointer-events-none' : ''}`}
        style={{ width: cardWidth, height: cardHeight, ...stackStyle }}
        onClick={handleCardClick}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className={`absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${isPeek ? 'brightness-90 blur-[1.5px] opacity-70' : ''}`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            <span className="uppercase tracking-widest text-xs text-gray-700/80 mb-2">Question</span>
            <p className="text-2xl text-center text-gray-900 font-bold drop-shadow-lg mb-4 font-mono break-words whitespace-pre-line max-h-[40vh] overflow-y-auto">{card.question}</p>
            {!isPeek && <span className="text-xs text-gray-500 mt-2">(Click card to flip)</span>}
          </div>
          {/* Back */}
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${isPeek ? 'brightness-90 blur-[1.5px] opacity-70' : ''}`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            <span className="uppercase tracking-widest text-xs text-gray-700/80 mb-2">Answer</span>
            <p className="text-xl text-center text-gray-900 font-bold drop-shadow-lg font-mono break-words whitespace-pre-line max-h-[40vh] overflow-y-auto">{card.answer}</p>
            {!isPeek && <span className="text-xs text-gray-500 mt-2">(Click card to flip)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
