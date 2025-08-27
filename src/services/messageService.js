import apiClient from "../api/axios";

const messageService = {
  getMessages: async (sender, receiver) => {
    const response = await apiClient.get(`/api/messages/${sender}/${receiver}`);
    return response.data;
  },

  sendMessage: async (messageData) => {
    const response = await apiClient.post('/api/send-message', messageData);
    return response.data;
  },

  getStudentConversations: async (studentId) => {
    const response = await apiClient.get(`/api/conversations/student/${studentId}`);
    return response.data;
  },

  getInstructorConversations: async (instructorId) => {
    const response = await apiClient.get(`/api/conversations/instructor/${instructorId}`);
    return response.data;
  },

  getInstructors: async () => {
    const response = await apiClient.get('/api/instructors');
    return response.data;
  }
};

export default messageService;
