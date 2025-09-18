import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  userSupportSchema,
} from "../../validation/support/support.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";
import { addUserSupportController, deleteUserSupportController, getUserSupportByIdController, getUserSupportsController, updateUserSupportController } from "../../controllers/support/support.controller";

const userSupportRoutes = Router();

// Apply security stack to all auth routes
userSupportRoutes.use(...securityStack);

// Apply authentication to all support routes
userSupportRoutes.use(authenticateToken);

//! support routes - users can only access their own support
// Users can view/update their own support OR admins can manage any user

// Add user support
userSupportRoutes.post(
  "/:userId/add",
  validateRequest(userSupportSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.CREATE_SUPPORT] }),
  addUserSupportController
);

// Get user support
userSupportRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_SUPPORT] }),
  getUserSupportsController
);

// Get user support by id
userSupportRoutes.get(
  "/:userId/:id",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_SUPPORT] }),
  getUserSupportByIdController
);

// Update user support
userSupportRoutes.put(
  "/:userId/:id",
  validateRequest(userSupportSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.EDIT_SUPPORT] }),
  updateUserSupportController
);

// Delete user support
userSupportRoutes.delete(
  "/:userId/:id",
  isAuthorization({ allowSelf: true, permissions: [Permissions.DELETE_SUPPORT] }),
  deleteUserSupportController
);

export default userSupportRoutes;