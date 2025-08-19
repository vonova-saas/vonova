import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import * as QuizService from "../../services/quizzes/quiz.service";
import { HTTPSTATUS } from "../../config/http.config";

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, topic, noOfQuestions, questions } = req.body;

  const quiz = await QuizService.createQuiz(
    title,
    description,
    topic,
    noOfQuestions,
    questions,
    req.user!.id
  );

  res.status(HTTPSTATUS.CREATED).json({
    message: "quiz created successfully",
    data: quiz
  })
});



export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, topic, noOfQuestions, questions } = req.body;

  const quiz = await QuizService.updateQuiz(
    req.params.id,
    title,
    description,
    topic,
    noOfQuestions,
    questions,
    req.user!.id
  );

  res.status(HTTPSTATUS.OK).json({
    message: "Quiz updated successfully",
    data: quiz,
  });
});
