import React, { useState } from "react";
import useFlashcardStore from "../../store/student/flashcardStore";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import FlashcardControls from "../../features/student/flashcards/components/FlashcardControls";
import DeckSelector from "../../features/student/flashcards/components/DeckSelector";

const FlashcardPage = () => {
  const { generateFlashcards, modules, isLoading, error } = useFlashcardStore();
  const [generatedDeck, setGeneratedDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedModuleId) return;
    setLoading(true);
    const result = await generateFlashcards(selectedModuleId);
    if (result && result.success) {
      // Fetch the generated flashcards from backend response
      // You may need to update generateFlashcards to return flashcards
      // For now, fetch from store decks
      setGeneratedDeck(useFlashcardStore.getState().decks[selectedModuleId] || []);
      setCurrentIndex(0);
    }
    setLoading(false);
  };

  const currentCard = generatedDeck.length > 0 ? generatedDeck[currentIndex] : null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        Flashcards (Generated)
      </h1>
      <div className="mb-6">
        <label htmlFor="module-select" className="mr-2 font-semibold">Select Module:</label>
        <select
          id="module-select"
          value={selectedModuleId}
          onChange={e => setSelectedModuleId(e.target.value)}
          className="p-2 rounded-md border-2 border-gray-300"
        >
          <option value="">-- Select --</option>
          {modules.map(m => (
            <option key={m._id} value={m._id}>{m.title || m.module_name || m._id}</option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
          disabled={loading || !selectedModuleId}
        >
          {loading ? "Generating..." : "Generate Flashcards"}
        </button>
      </div>
      <div className="mb-6">
        {currentCard ? (
          <Flashcard card={currentCard} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Select a module and generate flashcards.</p>
          </div>
        )}
      </div>
      {currentCard && (
        <div className="flex items-center justify-center mt-8 space-x-8">
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            className="px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-primary-dark hover:bg-gray-200 transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-xl font-bold text-gray-600">
            {currentIndex + 1} / {generatedDeck.length}
          </span>
          <button
            onClick={() => setCurrentIndex(i => Math.min(i + 1, generatedDeck.length - 1))}
            className="px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-primary-dark hover:bg-gray-200 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardPage;
