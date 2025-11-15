import { create } from 'zustand';
import apiClient from '../../api/axiosClient';

const useAdminModulesStore = create((set, get) => ({
  modules: [],
  instructors: [],
  isLoading: false,
  error: null,
  editingModule: null,
  isModalOpen: false,
  success: null,

  fetchModules: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get('/api/instructor/modules'); // returns all modules (including archived)
      set({ modules: res.data || [], isLoading: false });
    } catch (e) {
      set({ error: e.message || 'Failed to load modules', isLoading: false });
    }
  },

  fetchInstructors: async () => {
    try {
      const res = await apiClient.get('/api/instructors');
      const list = (res.data || []).map(i => ({
        id: i.id_number,
        name: `${(i.firstname||'')} ${(i.lastname||'')}`.trim(),
        program: i.program || ''
      }));
      set({ instructors: list });
    } catch (e) {
      // non-fatal; keep silent
    }
  },

  openEdit: (module) => set({ editingModule: module, isModalOpen: true, success: null, error: null }),
  closeEdit: () => set({ editingModule: null, isModalOpen: false }),

  archiveModule: async (id) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await apiClient.put(`/api/modules/${id}/archive`);
      await get().fetchModules();
      set({ success: 'Module archived', isLoading: false });
    } catch (e) {
      set({ error: e.message || 'Archive failed', isLoading: false });
    }
  },

  unarchiveModule: async (id) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await apiClient.put(`/api/modules/${id}/unarchive`);
      await get().fetchModules();
      set({ success: 'Module restored', isLoading: false });
    } catch (e) {
      set({ error: e.message || 'Unarchive failed', isLoading: false });
    }
  },

  updateModule: async (formData) => {
    const id = get().editingModule?._id;
    if (!id) return;
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await apiClient.put(`/api/modules/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Update failed');
      }
      await get().fetchModules();
      set({ success: 'Module updated', isLoading: false, isModalOpen: false, editingModule: null });
    } catch (e) {
      set({ error: e.message || 'Update failed', isLoading: false });
    }
  },

  createModule: async (formData) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const res = await apiClient.post('/api/create_module', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Creation failed');
      }
      await get().fetchModules();
      set({ success: 'Module created', isLoading: false });
    } catch (e) {
      set({ error: e.message || 'Creation failed', isLoading: false });
    }
  }
  ,
  // Create Module modules: rows is array of { title, topic, description, assigned (single id), documentFile, pictureFile }
  submitBatch: async (creatorId, program, rows) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const fd = new FormData();
      fd.append('id_number', creatorId || '');
      rows.forEach(r => {
        fd.append('titles', r.title || '');
        fd.append('topics', r.topic || '');
        fd.append('descriptions', r.description || '');
        fd.append('programs', program || '');
        fd.append('assigned_instructor_ids', r.assigned || '');
        fd.append('is_published_list', '');
        fd.append('publish_ats', '');
        fd.append('documents', r.documentFile || '');
        fd.append('pictures', r.pictureFile || '');
      });
      const res = await apiClient.post('/api/admin/modules/batch_create', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      if (res.status >= 400) throw new Error(res.data?.message || 'Batch creation failed');
      await get().fetchModules();
      set({ success: 'Batch modules created', isLoading: false });
    } catch (e) {
      set({ error: e?.response?.data?.detail || e.message || 'Batch creation failed', isLoading: false });
    }
  }
}));

export default useAdminModulesStore;