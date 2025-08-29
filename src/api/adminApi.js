import axios from "axios";

const api = axios.create({
  baseURL: "https://final-cbrc.onrender.com/api",
  // You can add headers or interceptors here if needed
});

export default api;
