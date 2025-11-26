import React from "react";
import useFlashcardStore from "../../../../store/student/flashcardStore";

const FlashcardControls = () => {
  const { prevCard, nextCard, activeDeck, currentIndex } = useFlashcardStore();

  const total = (activeDeck && activeDeck.length) || 0;

  const disabledPrev = currentIndex <= 0;
  const disabledNext = currentIndex >= total - 1 || total === 0;

  return (
    <div className="flex items-center justify-center mt-8 space-x-6">
      <button
        onClick={prevCard}
        disabled={disabledPrev}
        aria-label="Previous card"
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${disabledPrev ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white text-primary-dark shadow-md hover:shadow-lg border border-primary/10 hover:bg-gray-50'}`}
      >
        <span className="text-lg">←</span>
        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="px-4 py-2 bg-primary text-white rounded-full shadow-md min-w-[96px] text-center">
        <span className="text-xs sm:text-sm font-medium opacity-90">Card</span>
        <div className="text-lg font-bold leading-none">{Math.max(0, currentIndex + 1)} / {total}</div>
      </div>

      <button
        onClick={nextCard}
        disabled={disabledNext}
        aria-label="Next card"
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${disabledNext ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white text-primary-dark shadow-md hover:shadow-lg border border-primary/10 hover:bg-gray-50'}`}
      >
        <span className="hidden sm:inline">Next</span>
        <span className="text-lg">→</span>
      </button>
    </div>
  );
};

export default FlashcardControls;
