import axios from "axios";

// 1. Read environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const API_KEY = import.meta.env.VITE_API_KEY || "";

// 2. Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Accept": "application/json",
  },
});

// 3. Request Interceptor: Attach API Key & Auth Token
api.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers["X-API-Key"] = API_KEY;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`📡 [API Request] ${config.method?.toUpperCase()} -> ${config.baseURL || ""}${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("❌ [API Request Error]:", error);
    return Promise.reject(error);
  }
);

// 4. Response Interceptor: Handle Global Responses & Errors
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ [API Response] ${response.status} <- ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`⚠️ [API Error ${error.response.status}] <- ${error.config?.url}:`, error.response.data);
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem("token");
      }
    } else if (error.request) {
      console.error("❌ [API Network Error] No response from backend:", error.message);
    } else {
      console.error("❌ [API Error]:", error.message);
    }
    return Promise.reject(error);
  }
);

// 5. Robust Helper Function to Format Media URLs
export const DEFAULT_CATEGORY_IMAGE = null;

export const getMediaUrl = (path, fallback = null) => {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Clean double /media/media/ if present from Django model upload_to
  let cleanPath = path;
  if (cleanPath.startsWith("/media/media/")) {
    cleanPath = cleanPath.replace("/media/media/", "/media/");
  } else if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  // Returning clean relative path allows Vite dev server proxy to handle it seamlessly
  // without triggering cross-origin or private network access blocks in Brave / Chrome!
  return cleanPath;
};

export default api;
