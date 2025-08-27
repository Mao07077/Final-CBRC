import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://cbrcs-final.onrender.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Note: Current backend doesn't use JWT tokens
// Authentication is handled per-route based on user data
apiClient.interceptors.request.use(
  (config) => {
    // No token authentication needed for current backend setup
    // User authentication is verified by sending user ID directly to endpoints
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
