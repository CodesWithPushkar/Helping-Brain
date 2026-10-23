import axios from "axios";

export const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const apiOrigin = new URL(apiBaseUrl).origin;

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

export default api;