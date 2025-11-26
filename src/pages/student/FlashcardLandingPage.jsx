import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Users } from "lucide-react";
import useFlashcardStore from "../../store/student/flashcardStore";
import apiClient from "../../api/axiosClient";

import DeckSelector from "../../features/student/flashcards/components/DeckSelector";
import Flashcard from "../../features/student/flashcards/components/Flashcard";
import FlashcardControls from "../../features/student/flashcards/components/FlashcardControls";

const FlashcardLandingPage = () => {
  const { activeDeck, currentIndex } = useFlashcardStore();
  const currentCard = activeDeck ? activeDeck[currentIndex] : null;
  const navigate = useNavigate();
  const { modules, decks, generationCounts, isLoading, error, fetchFlashcards, setActiveDeck, generateFlashcards } =
    useFlashcardStore();

  // State for PDF fetch popup
  const [pdfStatus, setPdfStatus] = useState({ open: false, message: "", error: false });
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [moduleImage, setModuleImage] = useState(null);

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
  setCurrentModuleId(moduleId);
  const result = await generateFlashcards(pdfText, 'auto', moduleId); // auto-generate based on module length
      if (result.success) {
        setGeneratedFlashcards(result.flashcards);
        setModalIndex(0);
        // Generate a single module-level image (cached) based on module title/topic
        try {
          const imgStorageKey = `module_image_${moduleId}`;
          // check localStorage first
          let cached = null;
          try {
            cached = localStorage.getItem(imgStorageKey);
          } catch (e) {
            cached = null;
          }
          if (cached) {
            setModuleImage(cached);
          } else {
            const topicForImage = module.title || module.module_name || module.topic || module.description || module.title || "Flashcard topic";
            const imgRes = await apiClient.post("/api/flashcard/generate-image", { topic: topicForImage });
            const url = imgRes?.data?.image_url || imgRes?.data?.image_raw || null;
            if (url) {
              setModuleImage(url);
              try {
                localStorage.setItem(imgStorageKey, url);
              } catch (e) {
                /* ignore storage write errors */
              }
            }
          }
        } catch (e) {
          // Log but continue — image is optional
          console.warn("Module image generation failed:", e);
        }

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
      {/* Flashcards Modal - one at a time with navigation */}
      {showFlashcards && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="flex flex-col items-center justify-center w-full h-full">
            {generatedFlashcards.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-2xl p-8 text-xl font-bold text-center">No flashcards generated.</div>
            ) : modalIndex < generatedFlashcards.length ? (
              <>
                {/* Main, large, responsive flashcard container */}
                <div className="flex flex-col items-center justify-center w-full h-[80vh] max-h-[90vh]">
                  <div className="relative w-full flex justify-center items-center h-full overflow-visible">
                    {/* Previous card peeking */}
                    {modalIndex > 0 && (
                      <div
                        className="absolute left-1/2 -translate-x-[70%] z-0 scale-90 opacity-60 pointer-events-none select-none rotate--8"
                        style={{ maxWidth: '320px', maxHeight: '440px', width: '28vw', height: '38vw', minWidth: '180px', minHeight: '250px' }}
                      >
                        <Flashcard card={generatedFlashcards[modalIndex - 1]} peek cachedImage={moduleImage} setCachedImage={setModuleImage} />
                      </div>
                    )}
                    {/* Next card peeking */}
                    {modalIndex < generatedFlashcards.length - 1 && (
                      <div
                        className="absolute left-1/2 -translate-x-[30%] z-0 scale-90 opacity-60 pointer-events-none select-none rotate-8"
                        style={{ maxWidth: '320px', maxHeight: '440px', width: '28vw', height: '38vw', minWidth: '180px', minHeight: '250px' }}
                      >
                        <Flashcard card={generatedFlashcards[modalIndex + 1]} peek cachedImage={moduleImage} setCachedImage={setModuleImage} />
                      </div>
                    )}
                    {/* Main card */}
                    <div
                      className="relative z-10 transition-transform duration-500 w-full flex justify-center"
                      style={{ maxWidth: '340px', maxHeight: '480px', width: '32vw', height: '44vw', minWidth: '200px', minHeight: '270px' }}
                    >
                      <Flashcard card={generatedFlashcards[modalIndex]} portrait cachedImage={moduleImage} setCachedImage={setModuleImage} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-8 space-x-6">
                  {(() => {
                    const total = generatedFlashcards.length || 0;
                    const disabledPrev = modalIndex <= 0;
                    const disabledNext = modalIndex >= total - 1 || total === 0;
                    return (
                      <>
                        <button
                          onClick={() => setModalIndex(i => Math.max(i - 1, 0))}
                          disabled={disabledPrev}
                          aria-label="Previous card"
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${disabledPrev ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white text-primary-dark shadow-md hover:shadow-lg border border-primary/10 hover:bg-gray-50'}`}
                        >
                          <span className="text-lg">←</span>
                          <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="px-4 py-2 bg-primary text-white rounded-full shadow-md min-w-[96px] text-center">
                          <span className="text-xs sm:text-sm font-medium opacity-90">Card</span>
                          <div className="text-lg font-bold leading-none">{Math.max(0, modalIndex + 1)} / {total}</div>
                        </div>

                        <button
                          onClick={() => setModalIndex(i => Math.min(i + 1, Math.max(0, total - 1)))}
                          disabled={disabledNext}
                          aria-label="Next card"
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 ${disabledNext ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white text-primary-dark shadow-md hover:shadow-lg border border-primary/10 hover:bg-gray-50'}`}
                        >
                          <span className="hidden sm:inline">Next</span>
                          <span className="text-lg">→</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
                {/* X close icon at top right */}
                <button
                  className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-100 text-2xl font-bold text-gray-700 shadow transition-all focus:outline-none"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                  onClick={() => setShowFlashcards(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center mt-8 text-center">
                <div className="text-3xl font-bold text-primary mb-4">You've reached the end!</div>
                <div className="mb-4 text-gray-700 text-lg">Do you want to generate more cards?</div>
                <button
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full font-bold shadow hover:scale-105 transition-all text-lg"
                  onClick={async () => {
                    setPdfStatus({ open: true, message: "Generating new unique flashcards...", error: false });
                    // Regenerate with a new seed (simulate by adding a random string)
                    const lastText = generatedFlashcards.map(fc => fc.question + fc.answer).join("|");
                    const { generateFlashcards } = useFlashcardStore.getState();
                    const result = await generateFlashcards(lastText + Math.random().toString(36).slice(2), 'auto', currentModuleId);
                    if (result.success) {
                      setGeneratedFlashcards(result.flashcards);
                      setModalIndex(0);
                      setShowFlashcards(true);
                      setPdfStatus({ open: false, message: "", error: false });
                    } else {
                      setPdfStatus({ open: true, message: result.message || "Failed to generate flashcards.", error: true });
                    }
                  }}
                >
                  Generate More Cards
                </button>
              </div>
            )}
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
              const attempts = (generationCounts && generationCounts[module._id]) || 0;

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
                          <span>{attempts} {attempts === 1 ? 'generation' : 'generations'}</span>
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
                        {attempts > 0
                          ? "Generated before"
                          : "No generations yet"}
                      </div>
                      <div
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          cardCount > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                          {attempts > 0 ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Start Practice
                          </>
                        ) : (
                          "Generate Now"
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
