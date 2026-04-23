"use client";

import axios from "axios";

const BASE_URL = "http://localhost:3000";

const resolveToken = () => {
  if (typeof window === "undefined") return null;

  const keys = ["accessToken", "access_token", "token", "jwt", "authToken"];
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
};

export const problemSolvingClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

problemSolvingClient.interceptors.request.use((config) => {
  const token = resolveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

problemSolvingClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

