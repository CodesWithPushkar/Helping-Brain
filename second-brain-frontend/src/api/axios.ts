import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
export const apiBaseUrl = /\/api$/i.test(normalizedApiUrl)
    ? normalizedApiUrl
    : `${normalizedApiUrl}/api`;
export const apiOrigin = new URL(apiBaseUrl).origin;

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

export default api;