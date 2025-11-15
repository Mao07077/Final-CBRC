import { create } from "zustand";
import apiClient from "../../api/axiosClient";
import useAuthStore from "../authStore";


const useReportStore = create((set, get) => ({
  title: "",
  content: "",
  screenshot: null,
  message: "",
  error: "",
  isLoading: false,
  reports: [],
  loadingReports: false,

  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setScreenshot: (file) => set({ screenshot: file }),

  // Derived value: count of reports with unread feedback
  getUnreadFeedbackCount: () => {
    const { reports } = get();
    return reports.filter(r => r.feedback && !r.feedbackRead).length;
  },

  fetchMyReports: async () => {
    set({ loadingReports: true, error: "" });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) throw new Error("User not authenticated");
      const res = await apiClient.get(`/api/reports`, { params: { id_number: userData.id_number } });
      set({ reports: res.data || [], loadingReports: false });
    } catch (e) {
      console.error("Fetch my reports error:", e);
      set({ error: "Failed to load your reports.", loadingReports: false });
    }
  },

  markFeedbackRead: async (reportId) => {
    try {
      await apiClient.put(`/api/reports/${reportId}/feedback/read`);
      // Update local state
      const { reports } = get();
      const updated = reports.map(r => r.id === reportId ? { ...r, feedbackRead: true } : r);
      set({ reports: updated });
      return true;
    } catch (e) {
      console.error("Mark feedback read error:", e);
      return false;
    }
  },

  submitReport: async () => {
    set({ isLoading: true, message: "", error: "" });

    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const { title, content, screenshot } = get();
      
      const formData = new FormData();
  formData.append("id_number", userData.id_number);
      formData.append("title", title);
      formData.append("content", content);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      await apiClient.post("/api/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({
        message: "Report submitted successfully!",
        isLoading: false,
        title: "",
        content: "",
        screenshot: null,
      });
      // Refresh list after successful submit
      const { fetchMyReports } = get();
      if (fetchMyReports) fetchMyReports();
    } catch (error) {
      console.error("Report submission error:", error);
      set({
        error: "Failed to submit report. Please try again.",
        isLoading: false,
      });
    }
  },
}));

export default useReportStore;
