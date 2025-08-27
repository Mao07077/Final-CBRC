import { create } from "zustand";
import apiClient from "../../api/axios";
import useAuthStore from "../authStore";


const useReportStore = create((set, get) => ({
  title: "",
  content: "",
  screenshot: null,
  message: "",
  error: "",
  isLoading: false,

  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setScreenshot: (file) => set({ screenshot: file }),

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
