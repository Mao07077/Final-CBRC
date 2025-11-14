import { create } from "zustand";
import apiClient from "../../api/axiosClient";
import useAuthStore from "../authStore";

const useFlashcardStore = create((set, get) => ({
  decks: {},
  modules: [],
  generationCounts: {}, // per-module attempt counts
  activeDeckId: null,
  activeDeck: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: false,
  error: null,

  fetchFlashcards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      // Fetch modules and their flashcards from backend
  const response = await apiClient.get(`/api/flashcards/${userData.id_number}`);
      
      if (response.data.success) {
        const { modules, decks, generationCounts } = response.data;
        
        set({ 
          modules,
          decks,
          generationCounts: generationCounts || {},
          activeDeckId: modules.length > 0 ? modules[0]._id : null,
          activeDeck: modules.length > 0 ? (decks[modules[0]._id] || []) : [],
          isLoading: false 
        });
      } else {
        throw new Error("Failed to fetch flashcards");
      }
    } catch (error) {
      console.error("Flashcard fetch error:", error);
      set({ 
        modules: [],
        decks: {},
        generationCounts: {},
        activeDeckId: null,
        activeDeck: [],
        isLoading: false, 
        error: "Failed to load flashcards. Please try again later." 
      });
    }
  },

  generateFlashcards: async (pdfText, numCards = 5, moduleId = null) => {
    set({ isLoading: true, error: null });
    try {
      // include module_id and generated_by for auditing/persistence
      const { userData } = useAuthStore.getState();
      const generatedBy = userData?.id_number || null;
      const response = await apiClient.post(
        "/generate-flashcards",
        { text: pdfText, num: numCards, module_id: moduleId, generated_by: generatedBy }
      );
      if (response.data.flashcards) {
        set({ isLoading: false });
        return { success: true, flashcards: response.data.flashcards };
      } else if (response.data.detail) {
        throw new Error(response.data.detail);
      } else {
        throw new Error("Failed to generate flashcards");
      }
    } catch (error) {
      console.error("Generate flashcards error:", error);
      set({ 
        isLoading: false, 
        error: error?.message || "Failed to generate flashcards. Please try again later." 
      });
      return { success: false, message: error.message, flashcards: [] };
    }
  },

  setActiveDeck: (deckId) => {
    const decks = get().decks;
    set({
      activeDeckId: deckId,
      activeDeck: decks[deckId] || [],
      currentIndex: 0,
      isFlipped: false,
    });
  },

  nextCard: () => {
    set((state) => ({
      currentIndex: (state.currentIndex + 1) % state.activeDeck.length,
      isFlipped: false,
    }));
  },

  prevCard: () => {
    set((state) => ({
      currentIndex:
        (state.currentIndex - 1 + state.activeDeck.length) %
        state.activeDeck.length,
      isFlipped: false,
    }));
  },

  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),
}));

export default useFlashcardStore;
