import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  updateUserAccountSchema,
} from "../../validation/settings/account.validation";
import { securityStack } from "../../middlewares/security";
import { getUserAccountController, updateUserAccountController } from "../../controllers/settings/account.controller";

const userAccountRoutes = Router();

// Apply security stack to all auth routes
userAccountRoutes.use(...securityStack);

// Apply authentication to all settings routes
userAccountRoutes.use(isAuthenticatedOrSignedContext);

//! Settings routes - users can only access their own settings

// Get user settings
userAccountRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_ACCOUNT),
  getUserAccountController
);

// Update user settings
userAccountRoutes.put(
  "/:userId",
  validateRequest(updateUserAccountSchema),
  hasPermission(Permissions.EDIT_ACCOUNT),
  updateUserAccountController
);

export default userAccountRoutes;