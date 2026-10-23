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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isGoogleSignIn = error.config?.url?.endsWith("/auth/google");
        if (
            error.response?.status === 401 &&
            localStorage.getItem("token") &&
            !isGoogleSignIn
        ) {
            localStorage.removeItem("token");

            if (window.location.pathname !== "/signin") {
                const next = window.location.pathname.startsWith("/join/")
                    ? `${window.location.pathname}${window.location.search}`
                    : "";
                const signInUrl = next
                    ? `/signin?next=${encodeURIComponent(next)}`
                    : "/signin";
                window.location.replace(signInUrl);
            }
        }

        return Promise.reject(error);
    },
);

export default api;