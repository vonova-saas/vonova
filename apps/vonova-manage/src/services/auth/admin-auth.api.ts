import API from "@/services/axios-client";
import { apiV1Path } from "@/services/gateway-path";
import {
  AdminRequestLoginCodeType,
  AdminRequestLoginCodeResponseType,
  AdminVerifyLoginType,
  AdminVerifyLoginResponseType,
  AdminResetPasswordType,
  AdminResetPasswordResponseType,
  AdminRefreshTokenResponseType,
  AdminCurrentUserResponseType,
} from "@/types/api/auth/admin-auth.type";

// ============== Admin Auth API Services ==============

// Step 1: Request OTP login code
export const adminRequestLoginCodeMutationFn = async (
  data: AdminRequestLoginCodeType
): Promise<AdminRequestLoginCodeResponseType> => {
  const response = await API.post(apiV1Path("admin/auth/request-login-code"), data);
  return response.data;
};

// Step 2: Verify OTP and get JWT token
export const adminVerifyLoginMutationFn = async (
  data: AdminVerifyLoginType
): Promise<AdminVerifyLoginResponseType> => {
  const response = await API.post(apiV1Path("admin/auth/verify-login"), data);
  return response.data;
};

// Step 3: Reset password
export const adminResetPasswordMutationFn = async (
  data: AdminResetPasswordType
): Promise<AdminResetPasswordResponseType> => {
  const response = await API.post(apiV1Path("admin/auth/reset-password"), data);
  return response.data;
};

export const adminRefreshTokenMutationFn = async (): Promise<AdminRefreshTokenResponseType> => {
  const refreshToken = localStorage.getItem("admin_refresh_token");
  if (!refreshToken) {
    throw new Error("Admin refresh token is missing");
  }
  const response = await API.post(apiV1Path("admin/auth/refresh-token"), {
    refreshToken,
  });
  const tokens = response.data as AdminRefreshTokenResponseType;
  localStorage.setItem("admin_token", tokens.access_token);
  localStorage.setItem("admin_refresh_token", tokens.refresh_token);
  return tokens;
};

export const adminLogoutMutationFn = async (): Promise<{ message: string }> => {
  const refreshToken = localStorage.getItem("admin_refresh_token");
  if (!refreshToken) {
    localStorage.removeItem("admin_token");
    return { message: "Logged out locally" };
  }
  const response = await API.post(apiV1Path("admin/auth/logout"), { refreshToken });
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  return response.data;
};

export const adminCurrentUserQueryFn = async (): Promise<AdminCurrentUserResponseType> => {
  const response = await API.get(apiV1Path("admin/auth/current-user"));
  return response.data;
};
