import React, { useState } from "react";
import moduleService from "../.././../../services/moduleService";

const ModuleFlashcards = ({ moduleId }) => {
  console.log('ModuleFlashcards rendered, moduleId:', moduleId);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Generating flashcards for moduleId:', moduleId);
      const data = await moduleService.generateFlashcards(moduleId);
      console.log('Flashcard response:', data);
      if (data.flashcards) {
        setFlashcards(data.flashcards);
      } else if (data.detail) {
        setError(`Backend error: ${data.detail}`);
      } else {
        setError("No flashcards returned.");
      }
    } catch (err) {
      console.error('Flashcard fetch error:', err);
      setError(err?.message || "Failed to load flashcards.");
    } finally {
      setLoading(false);
    }
  };

  // This component should only display flashcards if passed as props or used for viewing, not for generation
  return null;
};

export default ModuleFlashcards;
