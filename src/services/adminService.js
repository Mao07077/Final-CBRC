import apiClient from "../api/axiosClient";

const adminService = {
  createAccount: async (accountData) => {
    const response = await apiClient.post('/api/admin/accounts', accountData);
    return response.data;
  },
  getAllAccounts: async () => {
    const response = await apiClient.get('/api/admin/accounts');
    return response.data;
  },
  getAccountByIdNumber: async (idNumber) => {
    const response = await apiClient.get(`/api/admin/accounts/${idNumber}`);
    return response.data;
  },

  updateAccount: async (accountId, accountData) => {
    const response = await apiClient.put(`/api/admin/accounts/${accountId}`, accountData);
    return response.data;
  },

  deleteAccount: async (accountId) => {
    // Deprecated hard delete; use archive instead
    const response = await apiClient.put(`/api/admin/accounts/${accountId}/archive`);
    return response.data;
  },
  archiveAccount: async (accountId) => {
    const response = await apiClient.put(`/api/admin/accounts/${accountId}/archive`);
    return response.data;
  },
  unarchiveAccount: async (accountId) => {
    const response = await apiClient.put(`/api/admin/accounts/${accountId}/unarchive`);
    return response.data;
  },
  getArchivedAccounts: async () => {
    const response = await apiClient.get('/api/admin/accounts/archived');
    return response.data;
  },
  getArchivedPerformance: async (idNumber) => {
    const response = await apiClient.get(`/api/admin/archived/performance/${idNumber}`);
    return response.data;
  },
  setExamPromptSchedule: async (idNumber, promptDate) => {
    const response = await apiClient.put(`/api/admin/accounts/${idNumber}/exam-prompt`, { promptDate });
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
