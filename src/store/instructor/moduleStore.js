import { create } from "zustand";
import apiClient from '../../api/axiosClient';
import useAuthStore from '../authStore';

const useModuleStore = create((set, get) => ({
  modules: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingModule: null,

  // --- Actions ---
  fetchModules: (instructorId = null, program = null) => {
    set({ isLoading: true });
    // Default to current user's id_number if not explicitly provided
    const id = instructorId || useAuthStore.getState()?.userData?.id_number || null;
    const params = id ? `?instructor_id=${encodeURIComponent(id)}` : "";
    const url = id ? `/api/instructor/assigned-modules${params}` : '/api/instructor/modules';
    apiClient.get(url)
      .then(response => {
        let list = response.data || [];
        if (program && program !== "All Programs") {
          list = list.filter(m => (m.program || "") === program);
        }
        set({ modules: list, isLoading: false });
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

  // deleteModule removed: instructors are not allowed to delete modules

  // Schedule a module publish at a specific datetime (ISO string)
  scheduleModule: async (moduleId, publishAtISO) => {
    set({ isLoading: true });
    try {
      const fd = new FormData();
      fd.append('publish_at', publishAtISO);
      await apiClient.put(`/api/modules/${moduleId}/schedule`, fd);
      // refresh assigned modules
      const id = useAuthStore.getState()?.userData?.id_number || null;
      const modulesResponse = await apiClient.get(`/api/instructor/assigned-modules?instructor_id=${encodeURIComponent(id)}`);
      set({ modules: modulesResponse.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Publish module immediately
  publishNow: async (moduleId) => {
    set({ isLoading: true });
    try {
      await apiClient.post(`/api/modules/${moduleId}/publish-now`);
      // refresh assigned modules
      const id = useAuthStore.getState()?.userData?.id_number || null;
      const modulesResponse = await apiClient.get(`/api/instructor/assigned-modules?instructor_id=${encodeURIComponent(id)}`);
      set({ modules: modulesResponse.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // --- Modal Control ---
  openModal: (module) => {
    // Guard against creation; only allow editing existing modules
    if (!module) return; // ignore attempts to open with null
    set({ isModalOpen: true, editingModule: module, error: null });
  },
  closeModal: () => set({ isModalOpen: false, editingModule: null }),
}));

export default useModuleStore;
