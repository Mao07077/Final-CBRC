import { create } from "zustand";
import axios from "../../api/axios";

const useReportStore = create((set, get) => ({
  reports: [],
  filteredReports: [],
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

  deleteReport: async (reportId) => {
    if (!window.confirm("Are you sure you want to permanently delete this report?")) return;

    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/api/admin/reports/${reportId}`);
      if (response.data.success) {
        set((state) => {
          const updatedReports = state.reports.filter((r) => r._id !== reportId);
          return {
            reports: updatedReports,
            filteredReports: updatedReports,
            isLoading: false,
          };
        });
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      set({ error: 'Failed to delete report', isLoading: false });
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
