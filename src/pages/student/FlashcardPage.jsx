import React, { useState } from "react";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import { extractTextFromPDF } from "../../utils/pdfExtract";
import { generateFlashcardsFromText } from "../../utils/flashcardAI";
import { FaFilePdf, FaMagic, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const FlashcardPage = () => {
  const [generatedDeck, setGeneratedDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState(null);
  const [pdfName, setPdfName] = useState("");

  // Handle PDF upload and AI flashcard generation
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    setPdfFile(file);
    setPdfName(file ? file.name : "");
    setGeneratedDeck([]);
    setCurrentIndex(0);
    setError(null);
  };

  const handleGenerateAI = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError(null);
    setGeneratedDeck([]);
    try {
      const text = await extractTextFromPDF(pdfFile);
      const aiRaw = await generateFlashcardsFromText(text, 3);
      // Parse Q&A pairs from AI output (simple split)
      const cards = aiRaw.split(/\n|\r/)
        .map(line => line.trim())
        .filter(line => line.includes('?'))
        .map(q => {
          const parts = q.split('?');
          return {
            question: parts[0] + '?',
            answer: parts[1] ? parts[1].replace(/^\s*Answer:\s*/, '') : ''
          };
        });
      setGeneratedDeck(cards);
      setCurrentIndex(0);
    } catch (err) {
      setError('Failed to generate flashcards: ' + err.message);
    }
    setLoading(false);
  };

  const currentCard = generatedDeck.length > 0 ? generatedDeck[currentIndex] : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight drop-shadow">AI Flashcard Generator</h1>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <label htmlFor="pdf-upload" className="flex items-center gap-2 font-semibold text-lg mb-2">
          <FaFilePdf className="text-red-500 text-2xl" /> Upload Module PDF
        </label>
        <input
          type="file"
          id="pdf-upload"
          accept="application/pdf"
          onChange={handlePDFUpload}
          className="p-2 rounded-md border-2 border-gray-300 w-full max-w-xs mb-2"
        />
        {pdfName && (
          <div className="text-gray-600 text-sm mb-2">Selected: {pdfName}</div>
        )}
        <button
          onClick={handleGenerateAI}
          className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow font-bold text-lg mt-2 transition-all duration-200 ${loading || !pdfFile ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
          disabled={loading || !pdfFile}
        >
          <FaMagic /> {loading ? "Generating..." : "Generate AI Flashcards"}
        </button>
        {error && (
          <div className="text-red-500 mt-4 text-center">{error}</div>
        )}
      </div>
      <div className="mb-6">
        {currentCard ? (
          <Flashcard card={currentCard} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-100 to-blue-300 rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">Upload a module PDF and generate AI flashcards.</p>
          </div>
        )}
      </div>
      {currentCard && (
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
