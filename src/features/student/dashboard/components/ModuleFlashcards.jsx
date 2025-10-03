import React, { useState } from "react";
import moduleService from "../.././../../services/moduleService";

const ModuleFlashcards = ({ moduleId }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moduleService.generateFlashcards(moduleId);
      setFlashcards(data.flashcards || []);
    } catch (err) {
      setError("Failed to load flashcards.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8">
      <button
        onClick={fetchFlashcards}
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 mb-4"
      >
        Generate Flashcards
      </button>
      {loading && <div>Loading flashcards...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-blue-800 mb-2">Q: {card.question}</p>
            <p className="text-gray-700">A: {card.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleFlashcards;
