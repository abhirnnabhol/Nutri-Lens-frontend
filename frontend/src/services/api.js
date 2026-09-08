/**
 * NutriLens API Client
 * Centralized fetch client for backend REST endpoints.
 * Automatically injects JWT Bearer token from localStorage.
 */

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    let base = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "");
    if (base.startsWith("http") && !base.endsWith("/api")) {
      base = `${base}/api`;
    }
    return base;
  }

  // Automatic Render backend host detection:
  // When running on https://nutrilens-frontend-jqz0.onrender.com, automatically route to https://nutrilens-backend-jqz0.onrender.com/api
  if (typeof window !== "undefined" && window.location.hostname.includes("onrender.com")) {
    const host = window.location.hostname;
    if (host.includes("frontend")) {
      const backendHost = host.replace("frontend", "backend");
      return `https://${backendHost}/api`;
    }
  }

  return "/api";
}

const API_BASE_URL = getApiBaseUrl();

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem("nutrilens_token");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && data.error && data.error.message) ||
        (typeof data === "string" && data) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network error occurred", 0);
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (endpoint, options) =>
    request(endpoint, { ...options, method: "DELETE" }),
};

export { ApiError };
export default apiClient;
