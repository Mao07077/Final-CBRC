import apiClient from "../api/axios";


const scheduleService = {
  getSchedule: async (idNumber) => {
    const response = await apiClient.get(`/get_schedule/${idNumber}`);
    return response.data;
  },

  // Add getSchedules to match schedulerStore usage
  getSchedules: async (idNumber) => {
    const response = await apiClient.get(`/get_schedule/${idNumber}`);
    // If backend returns an array, use it directly; if not, wrap in array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.events || [];
  },

  createSchedule: async (scheduleData) => {
    const response = await apiClient.post('/create_schedule', scheduleData);
    return response.data;
  },

  updateSchedule: async (scheduleData) => {
    const response = await apiClient.put('/update_schedule', scheduleData);
    return response.data;
  },

  deleteSchedule: async (scheduleId) => {
    const response = await apiClient.delete(`/delete_schedule/${scheduleId}`);
    return response.data;
  }
};

export default scheduleService;
