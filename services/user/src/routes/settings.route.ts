import { Router } from "express";
import {
  getUserSettingsController,
  updateUserSettingsController,
} from "../controllers/settings.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import {
  updateUserSettingsSchema,
} from "../validation/settings.validation";
import { securityStack } from "../middlewares/security";

const userSettingsRoutes = Router();

// Apply security stack to all auth routes
userSettingsRoutes.use(...securityStack);

//! Settings routes - users can only access their own settings
userSettingsRoutes.get("/settings/:userId", isAuthenticated, canAccessOwnData('userId'), getUserSettingsController);
userSettingsRoutes.put("/settings/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userSettingsRoutes;
