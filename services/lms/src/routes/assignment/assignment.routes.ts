import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { createAssignmentSchema, submitAssignmentAnswersSchema, updateAssignmentSchema } from "../../validation/assignment/assignment.validation";
import { createAssignmentController, deleteAssignmentController, getAllAssignmentsController, getAssignmentController, getMyAttemptController, getMyAttemptsForAssignmentController, submitAssignmentAnswersController, updateAssignmentController } from "../../controllers/assignment/assignment.controller";

const assignmentRouter = Router();

assignmentRouter.use(...securityStack)

assignmentRouter.post(
  "/addAssignment",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.CREATE_ASSIGNMENT),
  validateRequest(createAssignmentSchema),
  createAssignmentController
);

assignmentRouter.patch(
  '/updateAssignment/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.EDIT_ASSIGNMENT),
  validateRequest(updateAssignmentSchema),
  updateAssignmentController
)

assignmentRouter.get(
  '/getAllAssignments',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_ASSIGNMENT),
  getAllAssignmentsController
)

assignmentRouter.get(
  '/getAssignment/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_ASSIGNMENT),
  getAssignmentController
)

assignmentRouter.delete(
  '/deleteAssignment/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.DELETE_ASSIGNMENT),
  deleteAssignmentController
);

// ===== Assignment Answers & Attempts =====
// Submit answers to a quiz and receive grade
assignmentRouter.post(
  '/:assignmentId/submit',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.SUBMIT_ASSIGNMENT),
  validateRequest(submitAssignmentAnswersSchema),
  submitAssignmentAnswersController
);

// Get my attempts for a quiz (own submissions)
assignmentRouter.get(
  '/:assignmentId/my-attempts',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_ASSIGNMENT_GRADES),
  getMyAttemptsForAssignmentController
);

// Get specific attempt (own)
assignmentRouter.get(
  '/attempts/:attemptId',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_ASSIGNMENT_GRADES),
  getMyAttemptController
);

export default assignmentRouter;
