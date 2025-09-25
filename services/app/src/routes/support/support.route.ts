import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  userSupportMessageSchema,
  userSupportSchema,
  userSupportStatusSchema,
} from "../../validation/support/support.validation";
import { securityStack } from "../../middlewares/security";
import { addUserSupportController, addUserSupportMessageController, deleteUserSupportController, getUserSupportByIdController, getUserSupportMessagesController, getUserSupportsController, updateUserSupportController, updateUserSupportStatusController } from "../../controllers/support/support.controller";

const userSupportRoutes = Router();

// Apply security stack to all auth routes
userSupportRoutes.use(...securityStack);

// Apply authentication to all support routes
userSupportRoutes.use(isAuthenticatedOrSignedContext);

//! support routes - users can only access their own support
// Users can view/update their own support OR admins can manage any user

// Add user support
userSupportRoutes.post(
  "/:userId/add",
  validateRequest(userSupportSchema),
  hasPermission(Permissions.CREATE_SUPPORT),
  addUserSupportController
);

// Get user support
userSupportRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_SUPPORT),
  getUserSupportsController
);

// Get user support by id
userSupportRoutes.get(
  "/:userId/:id",
  hasPermission(Permissions.VIEW_SUPPORT),
  getUserSupportByIdController
);

// Update user support
userSupportRoutes.put(
  "/:userId/:id",
  validateRequest(userSupportSchema),
  hasPermission(Permissions.EDIT_SUPPORT),
  updateUserSupportController
);

// Delete user support
userSupportRoutes.delete(
  "/:userId/:id",
  hasPermission(Permissions.DELETE_SUPPORT),
  deleteUserSupportController
);

//! ==================== Support Messages User Side Routes ====================
// Add message to a support ticket
userSupportRoutes.post(
  "/:userId/:id/messages",
  validateRequest(userSupportMessageSchema),
  hasPermission(Permissions.EDIT_SUPPORT),
  addUserSupportMessageController
);

// Get messages for a support ticket
userSupportRoutes.get(
  "/:userId/:id/messages",
  hasPermission(Permissions.VIEW_SUPPORT),
  getUserSupportMessagesController
);

// Update support ticket status
userSupportRoutes.put(
  "/:userId/:id/status",
  validateRequest(userSupportStatusSchema),
  hasPermission(Permissions.EDIT_SUPPORT),
  updateUserSupportStatusController
);

export default userSupportRoutes;