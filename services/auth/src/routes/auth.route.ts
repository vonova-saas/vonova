import { Router } from "express";
import passport from "passport";
import { Env } from "../config/env.config";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { authenticateToken, requireRole } from "../middlewares/auth/isAuthenticated.middleware";
import {
  registerUserController,
  verifyEmailCodeController,
  loginUserEmailController,
  refreshTokenController,
  requestResetPassController,
  verifyResetPassCodeController,
  resetPasswordController,
  logOutController,
  logOutAllDevicesController,
  googleLoginCallback,
} from "../controllers/auth.controller";
import { 
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  requestResetPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema
} from "../validation/auth.validation";

const googleFailedUrl = `${Env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

// Register routes
authRoutes.post("/register", validateRequest(registerSchema), registerUserController);
authRoutes.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmailCodeController)

// Login routes
authRoutes.post("/login", validateRequest(loginSchema), loginUserEmailController);
authRoutes.get("/refresh", refreshTokenController);

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
  googleLoginCallback
);

// Forget password routes
authRoutes.post("/request-resetPass", validateRequest(requestResetPasswordSchema), requestResetPassController);
authRoutes.post("/verify-resetPass-code", validateRequest(verifyResetCodeSchema), verifyResetPassCodeController);
authRoutes.post("/reset-password", validateRequest(resetPasswordSchema), resetPasswordController);

// Logout route
authRoutes.post("/logout", logOutController);
authRoutes.post("/logout-all", logOutAllDevicesController);

// Admin role endpoint
authRoutes.get("/admin-only", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
  res.json({ message: "You are an admin!" });
});

export default authRoutes;
