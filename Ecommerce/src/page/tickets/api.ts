import axios from "axios";

export const API_BASE = "http://localhost:4001/api";

export async function get(path: string, token?: string) {
  const t = token || localStorage.getItem("accessToken");
  return axios.get(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${t}` } });
}

export async function post(path: string, data: any, token?: string) {
  const t = token || localStorage.getItem("accessToken");
  return axios.post(`${API_BASE}${path}`, data, { headers: { Authorization: `Bearer ${t}` } });
}