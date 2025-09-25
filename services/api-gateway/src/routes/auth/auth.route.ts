import { Router } from "express";
import passport from "passport";
import { Env } from "../../config/env.config";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import {
  registerUserController,
  verifyEmailCodeController,
  welcomeUserEmailController,
  loginUserEmailController,
  oAuthGoogleLoginController,
  welcomeUseroAuthGoogleController,
  refreshTokenController,
  requestResetPassController,
  verifyResetPassCodeController,
  resetPasswordController,
  logOutController,
  logOutAllDevicesController,
  validateRoleChangeController,
  verifyAndPermissionsController,
  getCurrentUserController,
} from "../../controllers/auth/auth.controller";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  requestResetPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  validateRoleChangeSchema,
} from "../../validation/auth/auth.validation";
import { securityStack } from "../../middlewares/security";
import { requireInternalSecret } from "../../middlewares/security/internalSecret.middleware";

const googleFailedUrl = `${Env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

// Apply security stack to all auth routes
authRoutes.use(...securityStack);

//? ************* Email Flow Services *************
// Register routes
authRoutes.post("/register", validateRequest(registerSchema), registerUserController);
authRoutes.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmailCodeController)

// Login routes
authRoutes.post("/login", validateRequest(loginSchema), loginUserEmailController);

// Welcome (role selection) routes
authRoutes.post(
  "/welcome-email-user",
  welcomeUserEmailController
);

//! **************** oAuth Google Flow Services ****************
// OAuth Login routes
authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: googleFailedUrl,
    session: false,
  }),
  oAuthGoogleLoginController
);

// Welcome (role selection) routes
authRoutes.post(
  "/welcome-oauth-google",
  welcomeUseroAuthGoogleController
);

// Access & Refresh Tokenes routes
authRoutes.get("/refresh", refreshTokenController);

// Forget password routes
authRoutes.post("/request-resetPass", validateRequest(requestResetPasswordSchema), requestResetPassController);
authRoutes.post("/verify-resetPass-code", validateRequest(verifyResetCodeSchema), verifyResetPassCodeController);
authRoutes.post("/reset-password", validateRequest(resetPasswordSchema), resetPasswordController);

// Logout route
authRoutes.post("/logout", logOutController);
authRoutes.post("/logout-all", logOutAllDevicesController);

// Current User routes
authRoutes.get(
  "/currentUser",
  getCurrentUserController
);

// Role change validation endpoint (for inter-service communication)
authRoutes.post(
  "/validate-role-change",
  validateRequest(validateRoleChangeSchema),
  validateRoleChangeController
);

// Utility endpoints for inter-service communication
authRoutes.post(
  "/verify-and-permissions",
  requireInternalSecret,
  verifyAndPermissionsController
);

export default authRoutes;
