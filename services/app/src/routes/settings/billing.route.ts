import { Router } from "express";
import {
  getUserBillingController,
  updateUserBillingController,
} from "../../controllers/settings/billing.controller";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  updateUserBillingSchema,
} from "../../validation/settings/billing.validation";
import { securityStack } from "../../middlewares/security";

const userBillingRoutes = Router();

// Apply security stack to all auth routes
userBillingRoutes.use(...securityStack);

// Apply authentication to all settings routes
userBillingRoutes.use(isAuthenticatedOrSignedContext);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user billing
userBillingRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_BILLING),
  getUserBillingController
);

// Update user billing
userBillingRoutes.put(
  "/:userId",
  validateRequest(updateUserBillingSchema),
  hasPermission(Permissions.MANAGE_BILLING),
  updateUserBillingController
);

export default userBillingRoutes;