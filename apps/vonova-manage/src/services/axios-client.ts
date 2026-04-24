import { CustomError } from "@/types/error/custom-error.type";
import axios from "axios";
import { baseURL } from "./base-url";
import { apiV1Path } from "./gateway-path";

const options = {
  baseURL,
  withCredentials: true,
  timeout: 120000,
};

const API = axios.create(options);
let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;
const isBrowser = typeof window !== "undefined";

/** Relative URLs after /api/v1 are often `admin/...` (no leading slash before `admin`). */
function urlNeedsAdminAccessToken(url: string | undefined): boolean {
  if (!url) return false;
  if (url.includes("/account/")) return true;
  if (url.includes("/admin/")) return true;
  if (url.startsWith("admin/")) return true;
  return false;
}

// Add request interceptor to include JWT token for admin endpoints
API.interceptors.request.use(
  (config) => {
    // Attach admin JWT for protected admin/manage endpoints.
    // Account APIs are also protected and used by the admin dashboard.
    const needsAdminToken = urlNeedsAdminAccessToken(config.url);

    if (needsAdminToken && isBrowser) {
      // Get JWT token from localStorage
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const isMissingAccessTokenCookieError = (status: number, data: unknown) => {
  const message = (data as { message?: string })?.message ?? "";
  return status === 400 && message.toLowerCase().includes("access token cookie is required");
};

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }
    const { data, status } = error.response;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRefreshRequest =
      requestUrl.includes("/admin/auth/refresh-token") ||
      requestUrl.startsWith("admin/auth/refresh-token");
    const isAuthLoginRequest = requestUrl.includes("/auth/login");

    // Check if error message indicates token issues (for admin endpoints that return 403)
    const message = (data?.message || "").toLowerCase();
    const isTokenError = message.includes("admin access required") || message.includes("unauthorized") || message.includes("token");

    const shouldAttemptRefresh = status === 401 || status === 403 && isTokenError || isMissingAccessTokenCookieError(status, data);

    if (shouldAttemptRefresh && originalRequest && !originalRequest._retry && !isAuthRefreshRequest && !isAuthLoginRequest) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = API.post(apiV1Path("admin/auth/refresh-token"), {
            refreshToken: isBrowser ? localStorage.getItem("admin_refresh_token") : null,
          })
            .then((response) => {
              const tokens = response.data as { access_token?: string; refresh_token?: string };
              if (isBrowser && tokens.access_token && tokens.refresh_token) {
                localStorage.setItem("admin_token", tokens.access_token);
                localStorage.setItem("admin_refresh_token", tokens.refresh_token);
              }
              return response.data;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return API(originalRequest);
      } catch (refreshError) {
        if (isBrowser) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_refresh_token");
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    const customError: CustomError = {
      ...error,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;