import apiClient from "../api/axios";

const adminService = {
  getAllAccounts: async () => {
    const response = await apiClient.get('/api/accounts');
    return response.data;
  },

  updateAccount: async (accountData) => {
    const response = await apiClient.put('/api/accounts', accountData);
    return response.data;
  },

  deleteAccount: async (idNumber) => {
    const response = await apiClient.delete(`/api/accounts/${idNumber}`);
    return response.data;
  },

  getAttendance: async () => {
    const response = await apiClient.get('/api/attendance');
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get('/api/reports');
    return response.data;
  },

  updateReportStatus: async (reportId, status) => {
    const response = await apiClient.put(`/api/reports/${reportId}`, { status });
    return response.data;
  },

  getPosts: async () => {
    const response = await apiClient.get('/api/get_post');
    return response.data;
  },

  createPost: async (postData) => {
    const response = await apiClient.post('/api/post', postData);
    return response.data;
  },

  updatePost: async (postId, postData) => {
    const response = await apiClient.put(`/api/post/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await apiClient.delete(`/api/post/${postId}`);
    return response.data;
  },

  getAdminRequests: async () => {
    const response = await apiClient.get('/admin/requests');
    return response.data;
  }
};

export default adminService;
