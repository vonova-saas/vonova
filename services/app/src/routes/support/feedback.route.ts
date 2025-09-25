import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import {
  userFeedbackSchema,
  userFeedbackMessageSchema,
  userFeedbackStatusSchema,
} from "../../validation/support/feedback.validation";
import { securityStack } from "../../middlewares/security";
import { addUserFeedbackController, addUserFeedbackMessageController, deleteUserFeedbackController, getUserFeedbackByIdController, getUserFeedbackMessagesController, getUserFeedbacksController, updateUserFeedbackController, updateUserFeedbackStatusController } from "../../controllers/support/feedback.controller";

const userFeedbackRoutes = Router();

// Apply security stack to all auth routes
userFeedbackRoutes.use(...securityStack);

// Apply authentication to all Feedback routes
userFeedbackRoutes.use(isAuthenticatedOrSignedContext);

//! Feedback routes - users can only access their own Feedback
// Users can view/update their own Feedback OR admins can manage any user

// Add user Feedback
userFeedbackRoutes.post(
  "/:userId/add",
  validateRequest(userFeedbackSchema),
  hasPermission(Permissions.CREATE_FEEDBACK),
  addUserFeedbackController
);

// Get user Feedback
userFeedbackRoutes.get(
  "/:userId",
  hasPermission(Permissions.VIEW_FEEDBACK),
  getUserFeedbacksController
);

// Get user Feedback by id
userFeedbackRoutes.get(
  "/:userId/:id",
  hasPermission(Permissions.VIEW_FEEDBACK),
  getUserFeedbackByIdController
);

// Update user Feedback
userFeedbackRoutes.put(
  "/:userId/:id",
  validateRequest(userFeedbackSchema),
  hasPermission(Permissions.EDIT_FEEDBACK),
  updateUserFeedbackController
);

// Delete user Feedback
userFeedbackRoutes.delete(
  "/:userId/:id",
  hasPermission(Permissions.DELETE_FEEDBACK),
  deleteUserFeedbackController
);

// ==================== Feedback Messages User Side Routes ====================
// Add message to a feedback
userFeedbackRoutes.post(
  "/:userId/:id/messages",
  validateRequest(userFeedbackMessageSchema),
  hasPermission(Permissions.EDIT_FEEDBACK),
  addUserFeedbackMessageController
);

// Get messages for a feedback
userFeedbackRoutes.get(
  "/:userId/:id/messages",
  hasPermission(Permissions.VIEW_FEEDBACK),
  getUserFeedbackMessagesController
);

// Update feedback status
userFeedbackRoutes.put(
  "/:userId/:id/status",
  validateRequest(userFeedbackStatusSchema),
  hasPermission(Permissions.EDIT_FEEDBACK),
  updateUserFeedbackStatusController
);

export default userFeedbackRoutes;