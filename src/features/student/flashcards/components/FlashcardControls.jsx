import React from "react";
import useFlashcardStore from "../../../../store/student/flashcardStore";

const FlashcardControls = () => {
  const { prevCard, nextCard, activeDeck, currentIndex } = useFlashcardStore();

  return (
    <div className="flex items-center justify-center mt-8 space-x-8">
      <button
        onClick={prevCard}
        className="px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-primary-dark hover:bg-gray-200 transition-colors"
      >
        &larr; Prev
      </button>
      <span className="text-xl font-bold text-gray-600">
        {currentIndex + 1} / {activeDeck.length}
      </span>
      <button
        onClick={nextCard}
        className="px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-primary-dark hover:bg-gray-200 transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
};

export default FlashcardControls;
