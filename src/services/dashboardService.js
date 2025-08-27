import apiClient from "../api/axios";

const dashboardService = {
  getDashboardData: async (idNumber) => {
    try {
      const response = await apiClient.get(`/api/dashboard/${idNumber}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get dashboard data:", error);
      throw error;
    }
  },

  getRecommendedPages: async (idNumber) => {
    try {
      const response = await apiClient.get(
        `/students/${idNumber}/recommended-pages`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get recommended pages:", error);
      throw error;
    }
  },
};

export default dashboardService;
