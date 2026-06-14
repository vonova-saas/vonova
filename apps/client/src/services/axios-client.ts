import { CustomError } from "@/types/error/custom-error.type";
import { persistAccessTokenFromAuthResponse } from "@/lib/media/persist-access-token";
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
const API_VERSION_PREFIX = "/api/v1";
const baseURLIncludesApiVersion = baseURL?.replace(/\/+$/, "").endsWith(API_VERSION_PREFIX);

// Add request interceptor to include Authorization header
API.interceptors.request.use(
  (config) => {
    if (
      baseURLIncludesApiVersion &&
      typeof config.url === "string" &&
      config.url.startsWith(API_VERSION_PREFIX)
    ) {
      config.url = config.url.slice(API_VERSION_PREFIX.length) || "/";
    }

    // Get token from localStorage or cookies
    const url = String(config.url ?? "");
    const isCurrentUser = url.includes("/auth/current-user");
    // Prefer httpOnly cookie for session identity (avoids stale localStorage JWT).
    if (!isCurrentUser) {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
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
    const url = String(response.config?.url ?? "");
    if (
      typeof window !== "undefined" &&
      (url.includes("/auth/login") ||
        url.includes("/auth/refresh-token") ||
        url.includes("/auth/welcome-email-user"))
    ) {
      persistAccessTokenFromAuthResponse(response.data);
    }
    return response;
  },
  async (error) => {
    if (!error.response) {
      const cfg = error.config ?? {};
      const url =
        (cfg.baseURL ?? "").replace(/\/+$/, "") +
        (cfg.url?.startsWith("/") ? cfg.url : `/${cfg.url ?? ""}`);
      const reason =
        error.code === "ECONNABORTED"
          ? `timeout after ${cfg.timeout ?? "?"}ms`
          : error.code === "ERR_NETWORK"
            ? "network unreachable (API gateway down, CORS rejection, or DNS error)"
            : error.message || "no response";

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          `[axios] ${cfg.method?.toUpperCase() ?? "GET"} ${url} failed: ${reason}`,
        );
      }

      const customError: CustomError = {
        ...error,
        errorCode: error.code ?? "NETWORK_ERROR",
        message:
          `Could not reach API at ${url}. ${reason}. ` +
          `Check that the API gateway is running and NEXT_PUBLIC_API_BASE_URL is correct.`,
      };
      return Promise.reject(customError);
    }
    const { data, status } = error.response;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRefreshRequest = requestUrl.includes("/auth/refresh-token");
    const isAuthLoginRequest = requestUrl.includes("/auth/login");

    const shouldAttemptRefresh = status === 401 || isMissingAccessTokenCookieError(status, data);

    if (shouldAttemptRefresh && originalRequest && !originalRequest._retry && !isAuthRefreshRequest && !isAuthLoginRequest) {
      originalRequest._retry = true;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }

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

    const url = String(originalRequest?.url ?? "");
    if (url.includes("/community/")) {
      const raw = (data as { message?: string | string[] })?.message;
      const friendly = Array.isArray(raw)
        ? raw.map((s) => String(s)).join(" ")
        : typeof raw === "string"
          ? raw
          : undefined;
      if (friendly) {
        customError.message = friendly;
      } else if (status === 429) {
        customError.message =
          "Too many community actions in a short time. Please wait and try again.";
      } else if (status === 413) {
        customError.message = "File is too large for this upload.";
      }
    }

    return Promise.reject(customError);
  }
);

export default API;
