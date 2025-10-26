import React, { useState, useMemo, useEffect } from "react";
import apiClient from "../../../../api/axiosClient";
import "./custom-scrollbar.css";

// Helper to fetch image from backend Bytez API
const useFlashcardImage = (topic, cachedImage, setCachedImage) => {
  const [imageUrl, setImageUrl] = useState(cachedImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip if topic is empty, already loading, or image is cached
    if (!topic || loading || imageUrl) return;

    setLoading(true);
    setError(null);

    apiClient
      .post("/api/flashcard/generate-image", { topic })
      .then((res) => {
        console.log(`[Flashcard Image] Success for topic "${topic}":`, res.data.image_url);
        setImageUrl(res.data.image_url);
        // Update parent cache
        setCachedImage(res.data.image_url);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`[Flashcard Image] Error for topic "${topic}":`, err, err?.response?.data);
        setError("Image generation failed");
        setLoading(false);
      });
  }, [topic, imageUrl, setCachedImage, loading]);

  return { imageUrl, loading, error };
};

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
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

const Flashcard = ({ card, stacked = false, stackIndex = 0, peek = false, cachedImage, setCachedImage }) => {
  const { imageUrl, loading: imageLoading, error: imageError } = useFlashcardImage(card.question, cachedImage, setCachedImage);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardColor = useMemo(() => getRandomColor(card.question || ""), [card.question]);
  const isPeek = peek;

  const stackStyle = stacked
    ? {
        transform: `translateY(${stackIndex * 10}px) scale(${1 - stackIndex * 0.04})`,
        zIndex: 10 - stackIndex,
        filter: stackIndex > 0 ? "blur(1.5px) brightness(0.95)" : "none",
        opacity: stackIndex > 0 ? 0.7 : 1,
        pointerEvents: stackIndex > 0 ? "none" : "auto",
      }
    : {};

  const handleCardClick = () => {
    if (!isPeek) setIsFlipped((f) => !f);
  };

  // Landscape dimensions: wider than tall
  const cardWidth = isPeek ? "min(80vw, 480px)" : "min(90vw, 640px)";
  const cardHeight = isPeek ? "min(40vw, 240px)" : "min(45vw, 320px)";

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`relative select-none cursor-pointer ${isPeek ? "pointer-events-none" : ""}`}
        style={{
          width: cardWidth,
          height: cardHeight,
          minWidth: isPeek ? "240px" : "320px",
          minHeight: isPeek ? "120px" : "160px",
          maxWidth: isPeek ? "480px" : "640px",
          maxHeight: isPeek ? "240px" : "320px",
          ...stackStyle,
        }}
        onClick={handleCardClick}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div
            className={`absolute w-full h-full backface-hidden flex flex-row items-stretch ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${
              isPeek ? "brightness-90 blur-[1.5px] opacity-70" : ""
            }`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            {/* Left Half: Image */}
            <div className="w-1/2 flex items-center justify-center p-2 sm:p-4">
              {imageLoading && <span className="text-xs text-gray-500 animate-pulse">Generating image...</span>}
              {imageError && <span className="text-xs text-red-500">{imageError}</span>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={card.question}
                  className="rounded-lg w-full h-full object-cover border border-gray-200 shadow"
                />
              )}
            </div>
            {/* Right Half: Question */}
            <div className="w-1/2 flex flex-col items-center justify-center p-2 sm:p-4">
              <span className="uppercase tracking-widest text-[10px] sm:text-xs text-gray-700/80 mb-2">Question</span>
              <div className="w-full flex-1 flex items-center justify-center overflow-auto custom-scrollbar">
                <p className="text-base sm:text-lg md:text-xl text-center text-gray-900 font-bold drop-shadow-lg font-mono break-words whitespace-pre-line">
                  {card.question}
                </p>
              </div>
              {!isPeek && <span className="text-[10px] sm:text-xs text-gray-500 mt-2">(Click card to flip)</span>}
            </div>
          </div>
          {/* Back */}
          <div
            className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-row items-stretch ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${
              isPeek ? "brightness-90 blur-[1.5px] opacity-70" : ""
            }`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            {/* Left Half: Image (same as front) */}
            <div className="w-1/2 flex items-center justify-center p-2 sm:p-4">
              {imageLoading && <span className="text-xs text-gray-500 animate-pulse">Generating image...</span>}
              {imageError && <span className="text-xs text-red-500">{imageError}</span>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={card.question}
                  className="rounded-lg w-full h-full object-cover border border-gray-200 shadow"
                />
              )}
            </div>
            {/* Right Half: Answer */}
            <div className="w-1/2 flex flex-col items-center justify-center p-2 sm:p-4">
              <span className="uppercase tracking-widest text-[10px] sm:text-xs text-gray-700/80 mb-2">Answer</span>
              <div className="w-full flex-1 flex items-center justify-center overflow-auto custom-scrollbar">
                <p className="text-base sm:text-lg md:text-xl text-center text-gray-900 font-bold drop-shadow-lg font-mono break-words whitespace-pre-line">
                  {card.answer}
                </p>
              </div>
              {!isPeek && <span className="text-[10px] sm:text-xs text-gray-500 mt-2">(Click card to flip)</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;