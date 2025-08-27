import { create } from "zustand";
import apiClient from '../../api/axiosClient';

const useModuleStore = create((set, get) => ({
  modules: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingModule: null,

  // --- Actions ---
  fetchModules: () => {
    set({ isLoading: true });
    apiClient.get('/api/instructor/modules')
      .then(response => {
        set({ modules: response.data, isLoading: false });
      })
      .catch(error => {
        set({ error: error.message, isLoading: false });
      });
  },

  saveModule: async (formData) => {
    set({ isLoading: true });
    try {
      // Send to backend
      const response = await apiClient.post('/api/create_module', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!response.data.success) {
        set({ error: response.data.error || 'Module creation failed', isLoading: false });
        return;
      }
      // Always fetch instructor modules after creation
      const modulesResponse = await apiClient.get('/api/instructor/modules');
      set({ modules: modulesResponse.data, isLoading: false, isModalOpen: false, editingModule: null });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteModule: async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    set({ isLoading: true });
    try {
      const response = await apiClient.delete(`/api/modules/${moduleId}`);
      if (response.data && response.data.error) {
        set({ error: response.data.error, isLoading: false });
        return;
      }
      // Always fetch instructor modules after deletion
      const modulesResponse = await apiClient.get('/api/instructor/modules');
      set({ modules: modulesResponse.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // --- Modal Control ---
  openModal: (module = null) =>
    set({ isModalOpen: true, editingModule: module, error: null }),
  closeModal: () => set({ isModalOpen: false, editingModule: null }),
}));

export default useModuleStore;
