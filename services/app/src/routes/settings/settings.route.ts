import { Router } from "express";
import {
  getUserSettingsController,
  resetUserSettingsController,
  updateUserSettingsController,
} from "../../controllers/settings/settings.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  updateUserSettingsSchema,
} from "../../validation/settings/settings.validation";
import { securityStack } from "../../middlewares/security";

const userSettingsRoutes = Router();

// Apply security stack to all auth routes
userSettingsRoutes.use(...securityStack);

// Apply authentication to all settings routes
userSettingsRoutes.use(isAuthenticatedOrSignedContext);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user settings
userSettingsRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_SETTINGS),
  getUserSettingsController
);

// Update user settings
userSettingsRoutes.put(
  "/:userId",
  validateRequest(updateUserSettingsSchema),
  hasPermission(Permissions.MANAGE_SETTINGS),
  updateUserSettingsController
);

// Reset user settings to default
userSettingsRoutes.get(
  "/:userId/reset",
  hasPermission(Permissions.MANAGE_SETTINGS),
  resetUserSettingsController
);

export default userSettingsRoutes;
