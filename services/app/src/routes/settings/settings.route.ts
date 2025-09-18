import { Router } from "express";
import {
  getUserSettingsController,
  resetUserSettingsController,
  updateUserSettingsController,
} from "../../controllers/settings/settings.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  updateUserSettingsSchema,
} from "../../validation/settings/settings.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";

const userSettingsRoutes = Router();

// Apply security stack to all auth routes
userSettingsRoutes.use(...securityStack);

// Apply authentication to all settings routes
userSettingsRoutes.use(authenticateToken);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user settings
userSettingsRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_SETTINGS] }),
  getUserSettingsController
);

// Update user settings
userSettingsRoutes.put(
  "/:userId",
  validateRequest(updateUserSettingsSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.MANAGE_SETTINGS] }),
  updateUserSettingsController
);

// Reset user settings to default
userSettingsRoutes.get(
  "/:userId/reset",
  isAuthorization({ allowSelf: true, permissions: [Permissions.MANAGE_SETTINGS] }),
  resetUserSettingsController
);

export default userSettingsRoutes;
