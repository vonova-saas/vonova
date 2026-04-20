import API from "@/services/axios-client";
import {
  currentUserResponseType,
  loginResponseType,
  loginType,
} from "@/types/api/auth/auth.type";

// ============== Login API Services ==============
export const loginMutationFn = async (
  data: loginType
): Promise<loginResponseType> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

// ============== Refresh Token controllers ==============
export const refreshTokenMutationFn = async () => {
  const response = await API.get("/auth/refresh");
  return response.data;
};

// ============== Logout API Services ==============
export const logoutMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const logoutFromAllDevicesMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.post("/auth/logout-all");
  return response.data;
};

// ============== User API Services ==============
export const getCurrentUserQueryFn = async (): Promise<currentUserResponseType> => {
  const response = await API.get("/auth/current-User");
  return response.data;
};
