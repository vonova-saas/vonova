import { Router } from "express";
import {
  getUserNotificationController,
  resetUserNotificationController,
  updateUserNotificationController,
} from "../../controllers/settings/notification.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  updateUserNotificationSchema,
} from "../../validation/settings/notification.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";

const userNotificationRoutes = Router();

// Apply security stack to all auth routes
userNotificationRoutes.use(...securityStack);

// Apply authentication to all settings routes
userNotificationRoutes.use(authenticateToken);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user notification
userNotificationRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_NOTIFICATIONS] }),
  getUserNotificationController
);

// Update user notification
userNotificationRoutes.put(
  "/:userId",
  validateRequest(updateUserNotificationSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.MANAGE_NOTIFICATIONS] }),
  updateUserNotificationController
);

// Reset user notification to default
userNotificationRoutes.get(
  "/:userId/reset",
  isAuthorization({ allowSelf: true, permissions: [Permissions.MANAGE_NOTIFICATIONS] }),
  resetUserNotificationController
);

export default userNotificationRoutes;