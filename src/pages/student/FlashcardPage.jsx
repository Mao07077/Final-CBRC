import React, { useEffect } from "react";
import useFlashcardStore from "../../store/student/flashcardStore";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import FlashcardControls from "../../features/student/flashcards/components/FlashcardControls";
import DeckSelector from "../../features/student/flashcards/components/DeckSelector";

const FlashcardPage = () => {
  const { activeDeck, currentIndex, fetchFlashcards, isLoading, error } = useFlashcardStore();
  const currentCard = activeDeck ? activeDeck[currentIndex] : null;

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Flashcards
        </h1>
        <div className="mb-6">
          <DeckSelector />
        </div>
        <div className="mb-6">
          {currentCard ? (
            <Flashcard card={currentCard} />
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Select a deck to begin your review session.</p>
            </div>
          )}
        </div>
        {currentCard && <FlashcardControls />}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        Flashcards
      </h1>
      
      <div className="mb-6">
        <DeckSelector />
      </div>

      <div className="mb-6">
        {currentCard ? (
          <Flashcard card={currentCard} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Select a deck to begin your review session.</p>
          </div>
        )}
      </div>

      {currentCard && <FlashcardControls />}
    </div>
  );
};

export default FlashcardPage;
