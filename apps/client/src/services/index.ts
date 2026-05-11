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
import {
  getMySubscriptionFn,
  getSubscriptionHistoryFn,
  checkPlanFn,
  upgradeSubscriptionFn,
  cancelSubscriptionFn,
  getPricingFn,
  type Subscription,
  type PlanLimits,
  type PlanInfo,
  type PricingInfo,
} from "./app/subscription/subscription.api";
import {
  getBillingHistoryFn,
  getUserPaymentsFn,
  createCheckoutSessionFn,
  purchaseCourseFn,
  purchaseMaterialFn,
  type Payment,
  type BillingHistoryResponse,
  type CheckoutSessionRequest,
  type CheckoutSessionResponse,
} from "./app/payments/payments.api";

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
  //? subscription api services
  getMySubscriptionFn,
  getSubscriptionHistoryFn,
  checkPlanFn,
  upgradeSubscriptionFn,
  cancelSubscriptionFn,
  getPricingFn,
  //? payments api services
  getBillingHistoryFn,
  getUserPaymentsFn,
  createCheckoutSessionFn,
  purchaseCourseFn,
  purchaseMaterialFn,
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

// Types exports
export type {
  Subscription,
  PlanLimits,
  PlanInfo,
  PricingInfo,
  Payment,
  BillingHistoryResponse,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
};