import apiClient from "../api/axios";

const surveyService = {
  submit: async (surveyData) => {
    try {
      const response = await apiClient.post("/submit-survey", surveyData);
      return response.data;
    } catch (error) {
      console.error("Survey submission failed:", error);
      throw error;
    }
  },
};

export default surveyService;
