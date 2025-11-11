import { create } from "zustand";
import instructorDashboardService from "../../services/instructorDashboardService";

const useInstructorDashboardStore = create((set) => ({
  stats: { totalStudents: 0, engagementRate: 0, classAverageAccuracy: 0, avgStudyHours7d: 0 },
  modules: [],
  attendanceData: [],
  hoursHistogram: [],
  moduleCompletions: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async (instructorId, program = null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await instructorDashboardService.getDashboardStats(instructorId, program);
      set({
        isLoading: false,
        stats: data.stats || { totalStudents: 0, engagementRate: 0, classAverageAccuracy: 0, avgStudyHours7d: 0 },
        modules: data.modules || [],
        attendanceData: data.attendance || [],
        hoursHistogram: data.hoursHistogram || [],
        moduleCompletions: data.moduleCompletions || [],
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to fetch dashboard data',
        stats: { totalStudents: 0, engagementRate: 0, classAverageAccuracy: 0, avgStudyHours7d: 0 },
        modules: [],
        attendanceData: [],
        hoursHistogram: [],
        moduleCompletions: [],
      });
    }
  },
}));

export default useInstructorDashboardStore;
