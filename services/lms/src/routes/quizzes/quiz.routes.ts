import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import * as QuizController from "../../controllers/quizzes/quiz.controller"
import * as validationSchema from "../../validation/quizzes/quiz.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../../middlewares/auth/isAuthenticated.middleware";
import { isInstructorOrAdmin } from "../../middlewares/auth/isAuthorized.middleware";


const quizRouter = Router();

quizRouter.use(...securityStack)

quizRouter.post("/addQuiz", isAuthenticated, isInstructorOrAdmin, validateRequest(validationSchema.createQuizSchema), QuizController.createQuiz);

quizRouter.patch('/updateQuiz/:id', isAuthenticated, isInstructorOrAdmin, validateRequest(validationSchema.updateQuizSchema), QuizController.updateQuiz)

quizRouter.get('/getQuiz/:id', isAuthenticated, QuizController.getQuiz)

quizRouter.delete('/deleteQuiz/:id', isAuthenticated, isInstructorOrAdmin, QuizController.deleteQuiz);

export default quizRouter;
