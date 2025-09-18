import { Router } from "express";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import {
  userFeedbackSchema,
} from "../../validation/support/feedback.validation";
import { securityStack } from "../../middlewares/security";
import { Permissions } from "../../enums/role.enum";
import { addUserFeedbackController, deleteUserFeedbackController, getUserFeedbackByIdController, getUserFeedbacksController, updateUserFeedbackController } from "../../controllers/support/feedback.controller";

const userFeedbackRoutes = Router();

// Apply security stack to all auth routes
userFeedbackRoutes.use(...securityStack);

// Apply authentication to all Feedback routes
userFeedbackRoutes.use(authenticateToken);

//! Feedback routes - users can only access their own Feedback
// Users can view/update their own Feedback OR admins can manage any user

// Add user Feedback
userFeedbackRoutes.post(
  "/:userId/add",
  validateRequest(userFeedbackSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.CREATE_FEEDBACK] }),
  addUserFeedbackController
);

// Get user Feedback
userFeedbackRoutes.get(
  "/:userId",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_FEEDBACK] }),
  getUserFeedbacksController
);

// Get user Feedback by id
userFeedbackRoutes.get(
  "/:userId/:id",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_FEEDBACK] }),
  getUserFeedbackByIdController
);

// Update user Feedback
userFeedbackRoutes.put(
  "/:userId/:id",
  validateRequest(userFeedbackSchema),
  isAuthorization({ allowSelf: true, permissions: [Permissions.EDIT_FEEDBACK] }),
  updateUserFeedbackController
);

// Delete user Feedback
userFeedbackRoutes.delete(
  "/:userId/:id",
  isAuthorization({ allowSelf: true, permissions: [Permissions.DELETE_FEEDBACK] }),
  deleteUserFeedbackController
);

export default userFeedbackRoutes;