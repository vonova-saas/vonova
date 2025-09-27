import API from "@/services/axios-client";
import {
  registerType,
  verifyEmailType,
  welcomeUserType,
  currentUserResponseType,
  loginResponseType,
  loginType,
  welcomeUserResponseType,
  welcomeUserOAuthGoogleResponseType,
  verifyResetPasswordCodeType,
  requestResetPasswordType,
  resetPasswordType,
  welcomeUserOAuthGoogleType,
} from "@/types/api/app/auth/auth.type";

//? ************* Email Flow API Services *************
// ============== Register API Services ==============
export const registerMutationFn = async (
  data: registerType
): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/register", data);
  return response.data;
};

export const verifyEmailMutationFn = async (
  data: verifyEmailType
): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/verify-email", data);
  return response.data;
};

export const welcomeUserMutationFn = async (
  data: welcomeUserType
): Promise<welcomeUserResponseType> => {
  const response = await API.post("/api/v1/auth/welcome-email-user", data);
  return response.data;
};

// ============== Login API Services ==============
export const loginMutationFn = async (
  data: loginType
): Promise<loginResponseType> => {
  const response = await API.post("/api/v1/auth/login", data);
  return response.data;
};

//! **************** oAuth2 Flow Services ****************
// ============== OAuth API Services ==============
//* With Google
export const oAuthGoogleLoginMutationFn = async () => {
  const response = await API.get("/api/v1/auth/google");
  return response.data;
};

export const welcomeUserOAuthGoogleMutationFn = async (
  data: welcomeUserOAuthGoogleType
): Promise<welcomeUserOAuthGoogleResponseType> => {
  const response = await API.post("/api/v1/auth/welcome-oauth-google", data);
  return response.data;
};

//* With Github

// ============== Refresh Token controllers ==============
export const refreshTokenMutationFn = async () => {
  const response = await API.get("/api/v1/auth/refresh");
  return response.data;
};

// ============== Forget Password API Services ==============
export const requestResetPasswordMutationFn = async (
  data: requestResetPasswordType
): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/request-resetPass", data);
  return response.data;
};

export const verifyResetPasswordCodeMutationFn = async (
  data: verifyResetPasswordCodeType
): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/verify-resetPass-code", data);
  return response.data;
};

export const resetPasswordMutationFn = async (
  data: resetPasswordType
): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/reset-password", data);
  return response.data;
};

// ============== Logout API Services ==============
export const logoutMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/logout");
  return response.data;
};

export const logoutFromAllDevicesMutationFn = async (): Promise<{ message: string }> => {
  const response = await API.post("/api/v1/auth/logout-all");
  return response.data;
};

// ============== User API Services ==============
export const getCurrentUserQueryFn = async (): Promise<currentUserResponseType> => {
  const response = await API.get("/api/v1/auth/currentUser");
  return response.data;
};