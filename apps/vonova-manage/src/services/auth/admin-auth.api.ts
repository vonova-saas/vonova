import API from "@/services/axios-client";
import {
  AdminRequestLoginCodeType,
  AdminRequestLoginCodeResponseType,
  AdminVerifyLoginType,
  AdminVerifyLoginResponseType,
  AdminResetPasswordType,
  AdminResetPasswordResponseType,
} from "@/types/api/auth/admin-auth.type";

// ============== Admin Auth API Services ==============

// Step 1: Request OTP login code
export const adminRequestLoginCodeMutationFn = async (
  data: AdminRequestLoginCodeType
): Promise<AdminRequestLoginCodeResponseType> => {
  const response = await API.post("/admin/auth/request-login-code", data);
  return response.data;
};

// Step 2: Verify OTP and get JWT token
export const adminVerifyLoginMutationFn = async (
  data: AdminVerifyLoginType
): Promise<AdminVerifyLoginResponseType> => {
  const response = await API.post("/admin/auth/verify-login", data);
  return response.data;
};

// Step 3: Reset password
export const adminResetPasswordMutationFn = async (
  data: AdminResetPasswordType
): Promise<AdminResetPasswordResponseType> => {
  const response = await API.post("/admin/auth/reset-password", data);
  return response.data;
};
