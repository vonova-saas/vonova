import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { createQuizSchema, submitQuizAnswersSchema, updateQuizSchema } from "../../validation/quizzes/quiz.validation";
import { createQuizController, deleteQuizController, getAllQuizzesController, getQuizController, getMyAttemptController, getMyAttemptsForQuizController, submitQuizAnswersController, updateQuizController } from "../../controllers/quizzes/quiz.controller";

const quizRouter = Router();

quizRouter.use(...securityStack)

quizRouter.post(
  "/addQuiz",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.CREATE_QUIZ),
  validateRequest(createQuizSchema),
  createQuizController
);

quizRouter.patch(
  '/updateQuiz/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.EDIT_QUIZ),
  validateRequest(updateQuizSchema),
  updateQuizController
)

quizRouter.get(
  '/getAllQuizzes',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_QUIZ),
  getAllQuizzesController
)

quizRouter.get(
  '/getQuiz/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_QUIZ),
  getQuizController
)

quizRouter.delete(
  '/deleteQuiz/:id',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.DELETE_QUIZ),
  deleteQuizController
);

// ===== Quiz Answers & Attempts =====
// Submit answers to a quiz and receive grade
quizRouter.post(
  '/:quizId/submit',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.SUBMIT_QUIZ),
  validateRequest(submitQuizAnswersSchema),
  submitQuizAnswersController
);

// Get my attempts for a quiz (own submissions)
quizRouter.get(
  '/:quizId/my-attempts',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_GRADES),
  getMyAttemptsForQuizController
);

// Get specific attempt (own)
quizRouter.get(
  '/attempts/:attemptId',
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_GRADES),
  getMyAttemptController
);

export default quizRouter;
