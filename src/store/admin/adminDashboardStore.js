
import { create } from "zustand";
import apiClient from "../../api/axiosClient";

const useAdminDashboardStore = create((set) => ({
  stats: {
    totalStudents: 0,
    totalInstructors: 0,
  },
  students: [],
  instructors: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/api/admin/dashboard");
      if (response.data.success) {
        set({
          stats: response.data.stats || { totalStudents: 0, totalInstructors: 0 },
          students: response.data.students || [],
          instructors: response.data.instructors || [],
          isLoading: false,
        });
      } else {
        throw new Error("Failed to fetch dashboard data");
      }
    } catch (error) {
      set({
        stats: { totalStudents: 0, totalInstructors: 0 },
        students: [],
        instructors: [],
        isLoading: false,
        error: "Failed to load dashboard data. Please try again later.",
      });
    }
  },
}));

export default useAdminDashboardStore;
