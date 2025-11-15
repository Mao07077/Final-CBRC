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
      // Ensure we send a datetime string that includes the local timezone
      // publishAtISO may be like '2025-11-15T11:15' or an ISO string.
      // If it's a local `datetime-local` value (no timezone), attach the local offset
      const makeIsoWithOffset = (input) => {
        try {
          // If input already contains a timezone or 'Z', return as-is
          if (input.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(input)) return input;
          // Normalize to `YYYY-MM-DDTHH:MM` (may already be that)
          const local = input.slice(0,16);
          const dt = new Date(local);
          const offsetMin = -dt.getTimezoneOffset(); // minutes ahead of UTC
          const sign = offsetMin >= 0 ? '+' : '-';
          const abs = Math.abs(offsetMin);
          const hh = String(Math.floor(abs / 60)).padStart(2, '0');
          const mm = String(abs % 60).padStart(2, '0');
          return `${local}:00${sign}${hh}:${mm}`;
        } catch (e) {
          return input;
        }
      };

      const fd = new FormData();
      fd.append('publish_at', makeIsoWithOffset(publishAtISO));
      // Debug: log FormData entries to help diagnose 422 issues
      try {
        for (const pair of fd.entries()) {
          console.log('scheduleModule FormData:', pair[0], pair[1]);
        }
      } catch (e) {
        console.log('Failed to log FormData entries', e);
      }
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
