import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { createQuizService, deleteQuizService, getQuizByIdService, getAllQuizzesService, updateQuizService, submitQuizAnswersService, getMyQuizAttemptService, getMyQuizAttemptsForQuizService } from "../../services/quizzes/quiz.service";

export const createQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, topic, noOfQuestions, questions } = req.body;

    const quiz = await createQuizService(
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
  }
);

export const updateQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, topic, noOfQuestions, questions } = req.body;

    const quiz = await updateQuizService(
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
  }
);

export const getAllQuizzesController = asyncHandler(
  async (req: Request, res: Response) => {
    const quizzes = await getAllQuizzesService();
    res.status(HTTPSTATUS.OK).json({
      message: "Quizzes retrieved successfully",
      data: quizzes,
    });
  });

export const getQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await getQuizByIdService(req.params.id);
    res.status(HTTPSTATUS.OK).json({
      message: "Quiz retrieved successfully",
      data: quiz,
    });
  }
);

export const deleteQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const quiz = await deleteQuizService(req.params.id, req.user!.id);
    res.status(HTTPSTATUS.OK).json({
      message: "Quiz deleted successfully",
      data: quiz,
    });
  }
);

// ===== Quiz Answers & Attempts =====
export const submitQuizAnswersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { answers } = req.body as { answers: Array<{ questionId: string; selectedOptionId: string }> };
    const result = await submitQuizAnswersService(req.params.quizId, req.user!.id, answers);

    res.status(HTTPSTATUS.OK).json({
      message: "Quiz submitted successfully",
      data: result,
    });
  }
);

export const getMyAttemptController = asyncHandler(
  async (req: Request, res: Response) => {
    const attempt = await getMyQuizAttemptService(req.params.attemptId, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Attempt retrieved successfully",
      data: attempt,
    });
  }
);

export const getMyAttemptsForQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getMyQuizAttemptsForQuizService(req.params.quizId, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Attempts retrieved successfully",
      data: attempts,
    });
  }
);