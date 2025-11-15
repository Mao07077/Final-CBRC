import apiClient from "../api/axiosClient";

const examFlowService = {
  getFlow: async (idNumber) => {
    const res = await apiClient.get(`/api/student/exam-flow/${idNumber}`);
    return res.data;
  },
  submitDecision: async (idNumber, payload) => {
    const res = await apiClient.put(`/api/student/exam-flow/${idNumber}/decision`, payload);
    return res.data;
  },
  submitResult: async (idNumber, payload) => {
    const res = await apiClient.put(`/api/student/exam-flow/${idNumber}/result`, payload);
    return res.data;
  },
  markRead: async (idNumber) => {
    const res = await apiClient.put(`/api/student/exam-flow/${idNumber}/read`);
    return res.data;
  }
};

export default examFlowService;
