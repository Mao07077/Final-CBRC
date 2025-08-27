import apiClient from "../api/axios";

const authService = {
  login: async (credentials) => {
    // Backend expects { idNumber, password }
    return apiClient.post("/api/login", {
      idNumber: credentials.idNumber,
      password: credentials.password
    });
  },

  signup: async (userData) => {
    // Backend expects the full signup data
    return apiClient.post("/api/signup", userData);
  },

  sendResetCode: async (data) => {
    // Backend expects { id_number, email }
    return apiClient.post("/api/forgot_password", data);
  },

  resetPassword: async (data) => {
    // Backend expects { id_number, reset_code, new_password }
    return apiClient.post("/api/reset_password", data);
  }
};

export default authService;
