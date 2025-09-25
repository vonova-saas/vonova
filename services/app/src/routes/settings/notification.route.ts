import { Router } from "express";
import {
  getUserNotificationController,
  resetUserNotificationController,
  updateUserNotificationController,
} from "../../controllers/settings/notification.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  updateUserNotificationSchema,
} from "../../validation/settings/notification.validation";
import { securityStack } from "../../middlewares/security";

const userNotificationRoutes = Router();

// Apply security stack to all auth routes
userNotificationRoutes.use(...securityStack);

// Apply authentication to all settings routes
userNotificationRoutes.use(isAuthenticatedOrSignedContext);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user notification
userNotificationRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_NOTIFICATIONS),
  getUserNotificationController
);

// Update user notification
userNotificationRoutes.put(
  "/:userId",
  validateRequest(updateUserNotificationSchema),
  hasPermission(Permissions.MANAGE_NOTIFICATIONS),
  updateUserNotificationController
);

// Reset user notification to default
userNotificationRoutes.get(
  "/:userId/reset",
  hasPermission(Permissions.MANAGE_NOTIFICATIONS),
  resetUserNotificationController
);

export default userNotificationRoutes;