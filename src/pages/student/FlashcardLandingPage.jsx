import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Users } from "lucide-react";
import useFlashcardStore from "../../store/student/flashcardStore";

import DeckSelector from "../../features/student/flashcards/components/DeckSelector";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import FlashcardControls from "../../features/student/flashcards/components/FlashcardControls";

const FlashcardLandingPage = () => {
  const { activeDeck, currentIndex } = useFlashcardStore();
  const currentCard = activeDeck ? activeDeck[currentIndex] : null;
  const navigate = useNavigate();
  const { modules, decks, isLoading, error, fetchFlashcards, setActiveDeck, generateFlashcards } =
    useFlashcardStore();

  // State for PDF fetch popup
  const [pdfStatus, setPdfStatus] = useState({ open: false, message: "", error: false });
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [showFlashcards, setShowFlashcards] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Step 1: Fetch PDF file for the selected module and show popup
  const handleStartFlashcards = async (moduleId) => {
    const module = modules.find((m) => m._id === moduleId);
    if (!module || !module.document_url) {
      setPdfStatus({ open: true, message: "No PDF URL found for this module.", error: true });
      return;
    }
    setPdfStatus({ open: true, message: "Fetching PDF...", error: false });
    try {
      const res = await fetch(module.document_url);
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      if (blob.type !== "application/pdf") {
        setPdfStatus({ open: true, message: `Fetched file is not a PDF (type: ${blob.type})`, error: true });
        return;
      }
      // Read PDF text using PDF.js
      const arrayBuffer = await blob.arrayBuffer();
      let pdfText = "";
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          pdfText += pageText + '\n';
        }
      } catch (e) {
        pdfText = '[PDF.js failed to extract text]';
      }
      setPdfStatus({ open: true, message: "Generating flashcards from PDF...", error: false });
      // Call Gemini backend to generate flashcards
      const { generateFlashcards } = useFlashcardStore.getState();
      const result = await generateFlashcards(pdfText, 5); // You can change 5 to desired number
      if (result.success) {
        setGeneratedFlashcards(result.flashcards);
        setShowFlashcards(true);
        setPdfStatus({ open: false, message: "", error: false });
      } else {
        setPdfStatus({ open: true, message: result.message || "Failed to generate flashcards.", error: true });
      }
    } catch (err) {
      setPdfStatus({ open: true, message: `Error fetching PDF: ${err.message}`, error: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchFlashcards()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* PDF Fetch/Generate Popup/Modal */}
      {pdfStatus.open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw] text-center">
            <div className={pdfStatus.error ? "text-red-600" : "text-green-700"}>
              {pdfStatus.message}
            </div>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              onClick={() => setPdfStatus({ ...pdfStatus, open: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Flashcards Modal */}
      {showFlashcards && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw] text-center max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Generated Flashcards</h2>
            {generatedFlashcards.length === 0 ? (
              <div>No flashcards generated.</div>
            ) : (
              <ul className="space-y-4">
                {generatedFlashcards.map((fc, idx) => (
                  <li key={idx} className="border rounded p-3 text-left">
                    <div className="font-semibold text-primary">Q: {fc.question}</div>
                    <div className="mt-1 text-gray-700">A: {fc.answer}</div>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              onClick={() => setShowFlashcards(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
          <p className="text-gray-600">
            Choose a flashcard deck to start practicing
          </p>
        </div>

        {/* Available Flashcard Decks */}
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No flashcard decks available
            </h3>
            <p className="text-gray-600">
              Complete some modules to generate flashcard decks for practice
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const moduleFlashcards = decks[module._id] || [];
              const cardCount = moduleFlashcards.length;

              return (
                <div
                  key={module._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
                  onClick={() => handleStartFlashcards(module._id)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-primary-light p-3 rounded-lg mr-4">
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {module.title ||
                            module.module_name ||
                            "Flashcard Deck"}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{cardCount} flashcards</span>
                        </div>
                      </div>
                    </div>

                    {module.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {module.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {cardCount > 0
                          ? "Ready to practice"
                          : "No cards available"}
                      </div>
                      <div
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          cardCount > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cardCount > 0 ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Start Practice
                          </>
                        ) : (
                          "No Cards"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Overview */}
        {modules.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Practice Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {modules.length}
                </div>
                <div className="text-sm text-gray-600">Total Decks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Object.values(decks).flat().length}
                </div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {
                    modules.filter((module) => decks[module._id]?.length > 0)
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Ready to Practice</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.round(
                    Object.values(decks).flat().length / (modules.length || 1)
                  )}
                </div>
                <div className="text-sm text-gray-600">Avg per Deck</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardLandingPage;
