import apiClient from "../api/axios";

const moduleService = {
  getAllModules: async () => {
    const response = await apiClient.get('/api/modules');
    return response.data;
  },

  getModule: async (moduleId) => {
    const response = await apiClient.get(`/api/modules/${moduleId}`);
    return response.data;
  },

  getPreTest: async (moduleId) => {
    const response = await apiClient.get(`/api/pre-test/${moduleId}`);
    return response.data;
  },

  submitPreTest: async (moduleId, answers, userId, timeSpent = 0) => {
    const response = await apiClient.post(`/api/pre-test/submit/${moduleId}`, {
      answers: answers,
      user_id: userId,
      time_spent: timeSpent
    });
    return response.data;
  },

  getPostTest: async (moduleId) => {
    const response = await apiClient.get(`/api/post-test/${moduleId}`);
    return response.data;
  },

  submitPostTest: async (moduleId, answers, userId, timeSpent = 0) => {
    const response = await apiClient.post(`/api/post-test/submit/${moduleId}`, {
      answers: answers,
      user_id: userId,
      time_spent: timeSpent
    });
    return response.data;
  },

  getModuleStatus: async (moduleId, userId) => {
    const response = await apiClient.get(`/api/module-status/${moduleId}/${userId}`);
    return response.data;
  },

  getFlashcards: async (moduleId) => {
    const response = await apiClient.get(`/api/flashcards/${moduleId}`);
    return response.data;
  }
};

export default moduleService;
