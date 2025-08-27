import React from "react";
import useFlashcardStore from "../../../../store/student/flashcardStore";

const DeckSelector = () => {
  const { decks, activeDeckId, setActiveDeck } = useFlashcardStore();

  return (
    <div className="text-center mb-4">
      <label htmlFor="deck-select" className="mr-2 font-semibold">
        Select Deck:
      </label>
      <select
        id="deck-select"
        value={activeDeckId || ""}
        onChange={(e) => setActiveDeck(e.target.value)}
        className="p-2 rounded-md border-2 border-gray-300"
      >
        {Object.keys(decks).map((deckId) => (
          <option key={deckId} value={deckId}>
            {deckId.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DeckSelector;
