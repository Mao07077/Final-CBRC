import { create } from "zustand";
import axios from "../../api/axiosClient";

const useReportStore = create((set, get) => ({
  reports: [],
  filteredReports: [],
  archivedReports: [],
  isLoading: false,
  error: null,
  selectedReport: null,

  // --- Actions ---
  fetchReports: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/admin/reports');
      if (response.data.success) {
        const reports = response.data.reports || [];
        set({ 
          reports, 
          filteredReports: reports, 
          isLoading: false 
        });
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      set({ 
        error: 'Failed to fetch reports', 
        isLoading: false,
        reports: [],
        filteredReports: []
      });
    }
  },

  fetchArchivedReports: async () => {
    try {
      const response = await axios.get('/api/admin/reports/archived');
      if (response.data.success) {
        set({ archivedReports: response.data.reports || [] });
      }
    } catch (error) {
      // ignore
    }
  },

  updateReportStatus: async (reportId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/admin/reports/${reportId}`, { status });
      if (response.data.success) {
        set((state) => {
          const updatedReports = state.reports.map((r) =>
            r._id === reportId ? { ...r, status } : r
          );
          const updatedFilteredReports = state.filteredReports.map((r) =>
            r._id === reportId ? { ...r, status } : r
          );
          return {
            reports: updatedReports,
            filteredReports: updatedFilteredReports,
            isLoading: false,
          };
        });
      } else {
        throw new Error('Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      set({ error: 'Failed to update report status', isLoading: false });
    }
  },

  archiveReport: async (reportId) => {
    if (!window.confirm("Archive this report? You can restore it later.")) return;
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/admin/reports/${reportId}/archive`);
      if (response.data.success) {
        set((state) => {
          const updatedReports = state.reports.filter((r) => r._id !== reportId);
          const updatedFilteredReports = state.filteredReports.filter((r) => r._id !== reportId);
          return { reports: updatedReports, filteredReports: updatedFilteredReports, isLoading: false };
        });
      } else {
        throw new Error('Failed to archive report');
      }
    } catch (error) {
      console.error('Error archiving report:', error);
      set({ error: 'Failed to archive report', isLoading: false });
    }
  },

  unarchiveReport: async (reportId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/admin/reports/${reportId}/unarchive`);
      if (response.data.success) {
        // After restore, refetch to include in main list
        await get().fetchReports();
        set({ isLoading: false });
      } else {
        throw new Error('Failed to restore report');
      }
    } catch (error) {
      console.error('Error restoring report:', error);
      set({ error: 'Failed to restore report', isLoading: false });
    }
  },

  setFeedback: async (reportId, feedback) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/admin/reports/${reportId}/feedback`, { feedback });
      if (response.data.success) {
        set((state) => {
          const updatedReports = state.reports.map(r => r._id === reportId ? { ...r, feedback } : r);
          const updatedFiltered = state.filteredReports.map(r => r._id === reportId ? { ...r, feedback } : r);
          return { reports: updatedReports, filteredReports: updatedFiltered, isLoading: false };
        });
      } else {
        throw new Error('Failed to save feedback');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      set({ error: 'Failed to save feedback', isLoading: false });
    }
  },

  filterReports: (filters) => {
    const { reports } = get();
    const { query = "", status = "All" } = filters;
    const lowerCaseQuery = query.toLowerCase();

    const results = reports.filter((report) => {
      const matchesQuery =
        report.student.toLowerCase().includes(lowerCaseQuery) ||
        report.issue.toLowerCase().includes(lowerCaseQuery);
      const matchesStatus =
        status !== "All"
          ? report.status.toLowerCase() === status.toLowerCase()
          : true;
      return matchesQuery && matchesStatus;
    });

    set({ filteredReports: results });
  },

  // --- Modal Control ---
  viewReport: (report) => set({ selectedReport: report }),
  closeModal: () => set({ selectedReport: null }),
}));

export default useReportStore;
