import apiClient from "../api/axios";

const profileService = {
  getProfile: async (idNumber) => {
    const response = await apiClient.get(`/api/profile/${idNumber}`);
    return response.data;
  },

  updateProfile: async (idNumber, profileData) => {
    const response = await apiClient.put(`/api/profile/${idNumber}`, profileData);
    return response.data;
  },

  getRecommendedPages: async (idNumber) => {
    const response = await apiClient.get(`/students/${idNumber}/recommended-pages`);
    return response.data;
  },

  getUserSettings: async (idNumber) => {
    const response = await apiClient.get(`/user/settings/${idNumber}`);
    return response.data;
  },

  updateUserSettings: async (idNumber, settings) => {
    const response = await apiClient.put(`/user/settings/${idNumber}`, settings);
    return response.data;
  }
};

export default profileService;
