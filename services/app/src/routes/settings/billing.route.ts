import { Router } from "express";
import {
  getUserBillingController,
  updateUserBillingController,
} from "../../controllers/settings/billing.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  updateUserBillingSchema,
} from "../../validation/settings/billing.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";

const userBillingRoutes = Router();

// Apply security stack to all auth routes
userBillingRoutes.use(...securityStack);

// Apply authentication to all settings routes
userBillingRoutes.use(authenticateToken);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user billing
userBillingRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_BILLING] }),
  getUserBillingController
);

// Update user billing
userBillingRoutes.put(
  "/:userId",
  validateRequest(updateUserBillingSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.MANAGE_BILLING] }),
  updateUserBillingController
);

export default userBillingRoutes;