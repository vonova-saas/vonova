import { CustomError } from "@/types/error/custom-error.type";
import axios from "axios";
import { baseURL } from "./base-url";

const options = {
  baseURL,
  withCredentials: true,
  timeout: 120000,
};

const API = axios.create(options);
let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

// Add request interceptor to include Authorization header
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const isAuthRefreshRequest = requestUrl.includes("/auth/refresh-token");
    const isAuthLoginRequest = requestUrl.includes("/auth/login");

    const shouldAttemptRefresh = status === 401 || isMissingAccessTokenCookieError(status, data);

    if (shouldAttemptRefresh && originalRequest && !originalRequest._retry && !isAuthRefreshRequest && !isAuthLoginRequest) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = API.post("/auth/refresh-token")
            .then((response) => response.data)
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return API(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
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