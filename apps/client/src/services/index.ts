//! App API Services
//? ************* Auth *************
import {
  registerMutationFn,
  verifyEmailMutationFn,
  welcomeUserMutationFn,
  loginMutationFn,
  oAuthGoogleLoginMutationFn,
  welcomeUserOAuthGoogleMutationFn,
  refreshTokenMutationFn,
  requestResetPasswordMutationFn,
  verifyResetPasswordCodeMutationFn,
  resetPasswordMutationFn,
  logoutMutationFn,
  logoutFromAllDevicesMutationFn,
  getCurrentUserQueryFn,
  studentOnboardingMutationFn,
  instructorOnboardingMutationFn,
} from "./app/auth/auth.api";
import {
  updateComment,
  updatePost,
} from "./app/community/community.api";

//? ************* Settings *************
//? ************* Account *************
//? ************* Billing *************
//? ************* Notification *************
//? ************* Support *************
//? ************* Feedback *************

//! Dev API Services
//! User API Services
//! Store API Services

export {
  // app services
  //? auth api services
  registerMutationFn,
  verifyEmailMutationFn,
  welcomeUserMutationFn,
  loginMutationFn,
  oAuthGoogleLoginMutationFn,
  welcomeUserOAuthGoogleMutationFn,
  refreshTokenMutationFn,
  requestResetPasswordMutationFn,
  verifyResetPasswordCodeMutationFn,
  resetPasswordMutationFn,
  logoutMutationFn,
  logoutFromAllDevicesMutationFn,
  getCurrentUserQueryFn,
  studentOnboardingMutationFn,
  instructorOnboardingMutationFn,
  updatePost,
  updateComment,
  //? settings api services
  //? account api services
  //? billing api services
  //? notification api services
  //? support api services
  //? feedback api services

  // dev services
  // user services
  // store services
}