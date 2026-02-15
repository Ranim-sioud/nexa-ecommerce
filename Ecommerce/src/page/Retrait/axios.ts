import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4001/api",
  headers: { "Content-Type": "application/json" }
});

// Interceptor pour ajouter token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;