import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { createAssignmentSchema, submitAssignmentAnswersSchema, updateAssignmentSchema } from "../../validation/assignment/assignment.validation";
import { createAssignmentController, deleteAssignmentController, getAllAssignmentsController, getAssignmentController, getMyAttemptController, getMyAttemptsForAssignmentController, submitAssignmentAnswersController, updateAssignmentController } from "../../controllers/assignment/assignment.controller";

const assignmentRouter = Router();

// Apply security stack to all auth routes
assignmentRouter.use(...securityStack);

// Apply authentication to all Feedback routes
assignmentRouter.use(isAuthenticatedOrSignedContext);

assignmentRouter.post(
  "/addAssignment",
  hasPermission(Permissions.CREATE_ASSIGNMENT),
  validateRequest(createAssignmentSchema),
  createAssignmentController
);

assignmentRouter.patch(
  '/updateAssignment/:id',
  hasPermission(Permissions.EDIT_ASSIGNMENT),
  validateRequest(updateAssignmentSchema),
  updateAssignmentController
)

assignmentRouter.get(
  '/getAllAssignments',
  hasPermission(Permissions.VIEW_ASSIGNMENT),
  getAllAssignmentsController
)

assignmentRouter.get(
  '/getAssignment/:id',
  hasPermission(Permissions.VIEW_ASSIGNMENT),
  getAssignmentController
)

assignmentRouter.delete(
  '/deleteAssignment/:id',
  hasPermission(Permissions.DELETE_ASSIGNMENT),
  deleteAssignmentController
);

// ===== Assignment Answers & Attempts =====
// Submit answers to a quiz and receive grade
assignmentRouter.post(
  '/:assignmentId/submit',
  hasPermission(Permissions.SUBMIT_ASSIGNMENT),
  validateRequest(submitAssignmentAnswersSchema),
  submitAssignmentAnswersController
);

// Get my attempts for a quiz (own submissions)
assignmentRouter.get(
  '/:assignmentId/my-attempts',
  hasPermission(Permissions.VIEW_ASSIGNMENT_GRADES),
  getMyAttemptsForAssignmentController
);

// Get specific attempt (own)
assignmentRouter.get(
  '/attempts/:attemptId',
  hasPermission(Permissions.VIEW_ASSIGNMENT_GRADES),
  getMyAttemptController
);

export default assignmentRouter;
