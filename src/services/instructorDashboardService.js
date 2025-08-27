import apiClient from "../api/axiosClient";

const instructorDashboardService = {
  getDashboardStats: async (instructorId, program = null) => {
    try {
      const url = program
        ? `/api/instructor/dashboard/${instructorId}?program=${encodeURIComponent(program)}`
        : `/api/instructor/dashboard/${instructorId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Failed to get instructor dashboard stats:", error);
      throw error;
    }
  },
};

export default instructorDashboardService;
