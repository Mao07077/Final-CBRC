import { create } from "zustand";
import instructorDashboardService from "../../services/instructorDashboardService";

const useInstructorDashboardStore = create((set) => ({
  stats: { totalStudents: 0, engagementRate: 0 },
  modules: [],
  attendanceData: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async (instructorId, program = null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await instructorDashboardService.getDashboardStats(instructorId, program);
      set({
        isLoading: false,
        stats: data.stats || { totalStudents: 0, engagementRate: 0 },
        modules: data.modules || [],
        attendanceData: data.attendanceData || [],
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to fetch dashboard data',
        stats: { totalStudents: 0, engagementRate: 0 },
        modules: [],
        attendanceData: [],
      });
    }
  },
}));

export default useInstructorDashboardStore;
