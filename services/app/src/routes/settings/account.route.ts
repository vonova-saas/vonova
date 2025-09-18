import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  updateUserAccountSchema,
} from "../../validation/settings/account.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";
import { getUserAccountController, updateUserAccountController } from "../../controllers/settings/account.controller";

const userAccountRoutes = Router();

// Apply security stack to all auth routes
userAccountRoutes.use(...securityStack);

// Apply authentication to all settings routes
userAccountRoutes.use(authenticateToken);

//! Settings routes - users can only access their own settings
// Users can view/update their own settings OR admins can manage any user

// Get user settings
userAccountRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_ACCOUNT] }),
  getUserAccountController
);

// Update user settings
userAccountRoutes.put(
  "/:userId",
  validateRequest(updateUserAccountSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.EDIT_ACCOUNT] }),
  updateUserAccountController
);

export default userAccountRoutes;