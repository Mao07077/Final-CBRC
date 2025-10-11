import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import { extractTextFromPDF } from "../../utils/pdfExtract";
import { generateFlashcardsFromText } from "../../utils/flashcardAI";
import { FaFilePdf, FaMagic, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const FlashcardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Accept generatedDeck from navigation state, fallback to empty array
  const [generatedDeck, setGeneratedDeck] = useState(() => location.state?.generatedDeck || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState(null);
  const [pdfName, setPdfName] = useState("");

  // If no generatedDeck and not loading, redirect back to landing page
  useEffect(() => {
    if (!loading && generatedDeck.length === 0) {
      navigate("/student/flashcards");
    }
  }, [generatedDeck, loading, navigate]);


  // Remove PDF upload and AI generation logic (handled in landing page)

  const currentCard = generatedDeck.length > 0 ? generatedDeck[currentIndex] : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight drop-shadow">AI Flashcard Generator</h1>
      <div className="mb-6">
        {generatedDeck.length > 0 ? (
          <Flashcard card={generatedDeck[currentIndex]} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-100 to-blue-300 rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No flashcards to display. Please generate flashcards from a module.</p>
          </div>
        )}
      </div>
      {generatedDeck.length > 0 && (
        <div className="flex items-center justify-center mt-8 space-x-8">
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <FaArrowLeft /> Prev
          </button>
          <span className="text-xl font-bold text-blue-700">
            {currentIndex + 1} / {generatedDeck.length}
          </span>
          <button
            onClick={() => setCurrentIndex(i => Math.min(i + 1, generatedDeck.length - 1))}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-md font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Next <FaArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardPage;
