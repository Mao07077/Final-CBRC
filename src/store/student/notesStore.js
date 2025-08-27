import { create } from "zustand";
import notesService from "../../services/notesService";
import useAuthStore from "../authStore";

const useNotesStore = create((set, get) => ({
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        set({ 
          notes: [], 
          isLoading: false, 
          error: "Please log in to view your notes" 
        });
        return;
      }

      const notes = await notesService.getNotes(userData.id_number);
      set({ notes: notes || [], isLoading: false });
    } catch (error) {
      console.error("Notes fetch error:", error);
      set({ 
        notes: [], 
        isLoading: false, 
        error: error.response?.data?.detail || "Failed to load notes. Please try again later." 
      });
    }
  },

  selectNote: (noteId) => {
    const note = get().notes.find((n) => n._id === noteId);
    set({ selectedNote: note || null });
  },

  deselectNote: () => {
    set({ selectedNote: null });
  },

  createNewNote: () => {
    set({ selectedNote: { _id: null, title: "", content: "" } });
  },

  saveNote: async (noteData) => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      // Ensure noteData is not null and has required fields
      if (!noteData) {
        throw new Error("Note data is missing");
      }

      // If creating a new note, generate a unique _id (timestamp-based)
      let noteId = noteData._id;
      if (!noteId) {
        noteId = Date.now().toString();
      }

      const notePayload = {
        ...noteData,
        _id: noteId,
        user_id: userData.id_number
      };

      let savedNote;
      if (noteData._id) {
        // Update existing note
        savedNote = await notesService.updateNote(noteData._id, notePayload);
      } else {
        // Create new note
        savedNote = await notesService.createNote(notePayload);
      }

      set((state) => {
        let updatedNotes;
        if (noteData._id) {
          updatedNotes = state.notes.map((n) =>
            n._id === noteData._id ? savedNote : n
          );
        } else {
          updatedNotes = [savedNote, ...state.notes];
        }
        return { notes: updatedNotes, selectedNote: savedNote, isLoading: false };
      });
    } catch (error) {
      console.error("Save note error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to save note" 
      });
    }
  },

  deleteNote: async (noteId) => {
    set({ isLoading: true, error: null });
    try {
      await notesService.deleteNote(noteId);
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== noteId),
        selectedNote: null,
        isLoading: false
      }));
    } catch (error) {
      console.error("Delete note error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to delete note" 
      });
    }
  },
}));

export default useNotesStore;
