import { create } from "zustand";

const usePostTestStore = create((set, get) => ({
  modules: [],

    fetchModules: async () => {
      try {
        let baseUrl = import.meta.env.VITE_API_URL || "https://final-cbrc.onrender.com";
        // Remove trailing slash if present
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        const response = await fetch(`${baseUrl}/api/instructor/modules`);
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();
        set({ modules: data });
      } catch (error) {
        set({ error: error.message });
      }
    },
  tests: {},
  editingTest: null,
  isModalOpen: false,
  isLoading: false,
  error: null,

  fetchTestsForModule: async (moduleId) => {
    set({ isLoading: true });
    try {
      let baseUrl = import.meta.env.VITE_API_URL || "https://final-cbrc.onrender.com";
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      const response = await fetch(`${baseUrl}/api/post-test/${moduleId}`);
      if (!response.ok) throw new Error('Failed to fetch post-tests');
      const data = await response.json();
      set((state) => ({
        tests: {
          ...state.tests,
          [moduleId]: [data],
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  openModal: (test) => {
    set({ editingTest: test, isModalOpen: true });
  },

  newTest: (moduleId, hasPreTest) => {
    if (!moduleId) {
      console.error("A module must be selected to create a new test.");
      return;
    }
    if (!hasPreTest) {
      // Allow creating post-test
      set({
        editingTest: {
          _id: `new_${Date.now()}`,
          module_id: moduleId,
          title: "",
          questions: [{ question: "", options: ["", "", "", ""], correctAnswer: "" }],
        },
        isModalOpen: true,
      });
    } else {
      // Only allow editing existing post-test
      const moduleTests = get().tests[moduleId] || [];
      if (moduleTests.length > 0) {
        set({ editingTest: moduleTests[0], isModalOpen: true });
      } else {
        alert("This module already has a pre-test. You can only edit the post-test.");
      }
    }
  },

  closeModal: () => {
    set({ isModalOpen: false, editingTest: null });
  },

  saveTest: async (testData) => {
    const { module_id, title, questions } = testData;
    let baseUrl = import.meta.env.VITE_API_URL || "https://final-cbrc.onrender.com";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await fetch(`${baseUrl}/createposttest/${module_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, questions }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch post-tests for the module
        await get().fetchTestsForModule(module_id);
        set({ success: "Post-test saved successfully!", isLoading: false, isModalOpen: false, editingTest: null });
      } else {
        set({ error: data.message || "Failed to save post-test", isLoading: false });
      }
    } catch (error) {
      set({ error: error.message || "Failed to save post-test", isLoading: false });
    }
  },

  deleteTest: (testId, moduleId) => {
    set((state) => {
      const updatedModuleTests = state.tests[moduleId].filter((t) => t._id !== testId);
      return {
        tests: {
          ...state.tests,
          [moduleId]: updatedModuleTests,
        },
      };
    });
  },
}));

export default usePostTestStore;
