import React, { useState, useMemo, useEffect } from "react";
import apiClient from "../../../../api/axiosClient";

// Helper to fetch image from backend Bytez API
const useFlashcardImage = (topic, cachedImage, setCachedImage) => {
  const [imageUrl, setImageUrl] = useState(cachedImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Use cachedImage prop or localStorage cache keyed by topic to avoid regenerating
    if (!topic) {
      setImageUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    const storageKey = `flashcard_image_${encodeURIComponent(topic)}`;

    // If caller provided a cached image, trust it and also write to localStorage for persistence
    const existingFromProp = cachedImage;
    if (existingFromProp) {
      setImageUrl(existingFromProp);
      try {
        localStorage.setItem(storageKey, existingFromProp);
      } catch (e) {
        /* ignore storage errors */
      }
      setLoading(false);
      setError(null);
      return;
    }

    // Check localStorage first
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setImageUrl(stored);
        setLoading(false);
        setError(null);
        // Inform parent cache if available
        if (setCachedImage) setCachedImage(stored);
        return;
      }
    } catch (e) {
      // ignore storage read errors and fall back to API
    }

    // No cache found, generate a new image
    setImageUrl(null);
    setError(null);
    setLoading(true);
    let cancelled = false;
    apiClient
      .post("/api/flashcard/generate-image", { topic })
      .then((res) => {
        if (cancelled) return;
        console.log("[Flashcard Image] Success:", res);
        const url = res?.data?.image_url || null;
        if (url) {
          setImageUrl(url);
          try {
            localStorage.setItem(storageKey, url);
          } catch (e) {
            /* ignore */
          }
          if (setCachedImage) setCachedImage(url);
        } else {
          setError("No image returned");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Flashcard Image] Error:", err, err?.response?.data);
        setError("Image generation failed");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topic, setCachedImage]); // Dependencies: topic, setCachedImage

  return { imageUrl, loading, error };
};

import "./custom-scrollbar.css";

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

const Flashcard = ({ card, stacked = false, stackIndex = 0, peek = false, portrait = false, cachedImage, setCachedImage }) => {
  const { imageUrl, loading: imageLoading, error: imageError } = useFlashcardImage(card.question, cachedImage, setCachedImage);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardColor = useMemo(() => getRandomColor(card.question || ""), [card.question]);
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

  const handleCardClick = () => {
    if (!isPeek) setIsFlipped((f) => !f);
  };

  // Larger landscape dimensions: wider than tall
  const cardWidth = isPortrait ? "min(90vw, 640px)" : "min(80vw, 600px)";
  const cardHeight = isPortrait ? "min(60vw, 400px)" : "min(50vw, 380px)";

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`relative select-none cursor-pointer ${isPeek ? "pointer-events-none" : ""}`}
        style={{
          width: cardWidth,
          height: cardHeight,
          ...stackStyle,
          minWidth: isPortrait ? "320px" : "300px",
          minHeight: isPortrait ? "200px" : "180px",
          maxWidth: isPortrait ? "640px" : "600px",
          maxHeight: isPortrait ? "400px" : "380px",
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
            className={`absolute w-full h-full backface-hidden flex flex-row items-center p-3 sm:p-5 md:p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${
              isPeek ? "brightness-90 blur-[1.5px] opacity-70" : ""
            }`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            {/* Left: Image (1/2 width) */}
            <div className="w-1/2 flex justify-center items-center pr-3 sm:pr-5">
              {imageLoading && <span className="text-sm text-gray-500 animate-pulse">Generating image...</span>}
              {imageError && <span className="text-sm text-red-500">{imageError}</span>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={card.question}
                  className="rounded-lg max-h-full object-contain border border-gray-200 shadow"
                  style={{ maxWidth: "100%" }}
                />
              )}
            </div>
            {/* Right: Question (1/2 width) */}
            <div className="w-1/2 flex flex-col items-start pl-3 sm:pl-5 h-full">
              <span className="uppercase tracking-widest text-xs sm:text-sm text-gray-700/80 mb-3 self-start">Question</span>
              <div className="w-full flex-1 overflow-y-auto hide-scrollbar">
                <p className="text-lg sm:text-xl md:text-2xl text-left w-full text-gray-900 font-bold drop-shadow-lg font-mono break-words whitespace-pre-line">
                  {card.question}
                </p>
              </div>
              {!isPeek && <span className="text-xs sm:text-sm text-gray-500 mt-3">(Click card to flip)</span>}
            </div>
          </div>
          {/* Back */}
          <div
            className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-row items-center p-3 sm:p-5 md:p-8 ${cardColor} rounded-2xl shadow-2xl border-2 border-white transform-gpu transition-all ${
              isPeek ? "brightness-90 blur-[1.5px] opacity-70" : ""
            }`}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)" }}
          >
            {/* Left: Image (1/2 width) */}
            <div className="w-1/2 flex justify-center items-center pr-3 sm:pr-5">
              {imageLoading && <span className="text-sm text-gray-500 animate-pulse">Generating image...</span>}
              {imageError && <span className="text-sm text-red-500">{imageError}</span>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={card.question}
                  className="rounded-lg max-h-full object-contain border border-gray-200 shadow"
                  style={{ maxWidth: "100%" }}
                />
              )}
            </div>
            {/* Right: Answer (1/2 width) */}
            <div className="w-1/2 flex flex-col items-start pl-3 sm:pl-5 h-full">
              <span className="uppercase tracking-widest text-xs sm:text-sm text-gray-700/80 mb-3 self-start">Answer</span>
              <div className="w-full flex-1 overflow-y-auto hide-scrollbar">
                <p className="text-lg sm:text-xl md:text-2xl text-left w-full text-gray-900 font-bold drop-shadow-lg font-mono break-words whitespace-pre-line">
                  {card.answer}
                </p>
              </div>
              {!isPeek && <span className="text-xs sm:text-sm text-gray-500 mt-3">(Click card to flip)</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;