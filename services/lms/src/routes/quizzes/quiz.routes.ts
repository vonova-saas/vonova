import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { createQuizSchema, submitQuizAnswersSchema, updateQuizSchema } from "../../validation/quizzes/quiz.validation";
import { createQuizController, deleteQuizController, getAllQuizzesController, getQuizController, getMyAttemptController, getMyAttemptsForQuizController, submitQuizAnswersController, updateQuizController } from "../../controllers/quizzes/quiz.controller";

const quizRouter = Router();

// Apply security stack to all auth routes
quizRouter.use(...securityStack);

// Apply authentication to all Feedback routes
quizRouter.use(isAuthenticatedOrSignedContext);

quizRouter.post(
  "/addQuiz",
  validateRequest(createQuizSchema),
  hasPermission(Permissions.CREATE_QUIZ),
  createQuizController
);

quizRouter.patch(
  '/updateQuiz/:id',
  hasPermission(Permissions.EDIT_QUIZ),
  validateRequest(updateQuizSchema),
  updateQuizController
)

quizRouter.get(
  '/getAllQuizzes',
  hasPermission(Permissions.VIEW_QUIZ),
  getAllQuizzesController
)

quizRouter.get(
  '/getQuiz/:id',
  hasPermission(Permissions.VIEW_QUIZ),
  getQuizController
)

quizRouter.delete(
  '/deleteQuiz/:id',
  hasPermission(Permissions.DELETE_QUIZ),
  deleteQuizController
);

// ===== Quiz Answers & Attempts =====
// Submit answers to a quiz and receive grade
quizRouter.post(
  '/:quizId/submit',
  hasPermission(Permissions.SUBMIT_QUIZ),
  validateRequest(submitQuizAnswersSchema),
  submitQuizAnswersController
);

// Get my attempts for a quiz (own submissions)
quizRouter.get(
  '/:quizId/my-attempts',
  hasPermission(Permissions.VIEW_GRADES),
  getMyAttemptsForQuizController
);

// Get specific attempt (own)
quizRouter.get(
  '/attempts/:attemptId',
  hasPermission(Permissions.VIEW_GRADES),
  getMyAttemptController
);

export default quizRouter;
