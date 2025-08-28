import { create } from "zustand";

const usePreTestStore = create((set, get) => ({
  preTests: {},
  isLoading: false,
  error: null,
  success: null,

  fetchPreTest: async (moduleId) => {
    set({ isLoading: true, error: null });
    let baseUrl = import.meta.env.VITE_API_URL || "https://final-cbrc.onrender.com";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    try {
      const response = await fetch(`${baseUrl}/api/pre-test/${moduleId}`);
      if (!response.ok) throw new Error('Failed to fetch pre-test');
      const data = await response.json();
      set((state) => ({
        preTests: {
          ...state.preTests,
          [moduleId]: data,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updatePreTest: async (moduleId, updateData) => {
    set({ isLoading: true, error: null, success: null });
    let baseUrl = import.meta.env.VITE_API_URL || "https://final-cbrc.onrender.com";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    try {
      const response = await fetch(`${baseUrl}/api/pre-test/${moduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        await get().fetchPreTest(moduleId);
        set({ success: "Pre-test updated successfully!", isLoading: false });
      } else {
        set({ error: data.message || "Failed to update pre-test", isLoading: false });
      }
    } catch (error) {
      set({ error: error.message || "Failed to update pre-test", isLoading: false });
    }
  },
}));

export default usePreTestStore;
