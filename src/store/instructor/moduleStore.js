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
      // Debug: log FormData entries to help diagnose 422 issues
      try {
        for (const pair of fd.entries()) {
          console.log('scheduleModule FormData:', pair[0], pair[1]);
        }
      } catch (e) {
        console.log('Failed to log FormData entries', e);
      }
      console.log('Scheduling module', moduleId, 'publish_at (ISO input):', publishAtISO);
      const res = await apiClient.put(`/api/modules/${moduleId}/schedule`, fd);
      console.log('Schedule response:', res.status, res.data);
      // Show a success message with the server-returned publish_at converted to local time
      try {
        const serverPublish = res.data?.publish_at || res.data?.publishAt || res.data?.publish_at;
        if (serverPublish) {
          const local = new Date(serverPublish).toLocaleString();
          set({ success: `Module scheduled for ${local}` });
        } else {
          set({ success: 'Module scheduled' });
        }
      } catch (e) {
        set({ success: 'Module scheduled' });
      }
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
