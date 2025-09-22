import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import { createAssignmentService, deleteAssignmentService, getAssignmentByIdService, getAllAssignmentsService, updateAssignmentService, submitAssignmentAnswersService, getMyAssignmentAttemptService, getMyAssignmentAttemptsForAssignmentService } from "../../services/assignment/assignment.service";

export const createAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, topic, noOfQuestions, questions } = req.body;

    const assignment = await createAssignmentService(
      title,
      description,
      topic,
      noOfQuestions,
      questions,
      req.user!.id
    );

    res.status(HTTPSTATUS.CREATED).json({
      message: "Assignment created successfully",
      data: assignment
    })
  });


export const updateAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, topic, noOfQuestions, questions } = req.body;

    const assignment = await updateAssignmentService(
      req.params.id,
      title,
      description,
      topic,
      noOfQuestions,
      questions,
      req.user!.id
    );

    res.status(HTTPSTATUS.OK).json({
      message: "Assignment updated successfully",
      data: assignment,
    });
  });

export const getAllAssignmentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignments = await getAllAssignmentsService();
    res.status(HTTPSTATUS.OK).json({
      message: "Assignments retrieved successfully",
      data: assignments,
    });
  });

export const getAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignment = await getAssignmentByIdService(req.params.id);
    res.status(HTTPSTATUS.OK).json({
      message: "Assignment retrieved successfully",
      data: assignment,
    });
  });

export const deleteAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const assignment = await deleteAssignmentService(req.params.id, req.user!.id);
    res.status(HTTPSTATUS.OK).json({
      message: "Assignment deleted successfully",
      data: assignment,
    });
  });

// ===== Assignment Answers & Attempts =====
export const submitAssignmentAnswersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { answers } = req.body as { answers: Array<{ questionId: string; selectedOptionId: string }> };
    const result = await submitAssignmentAnswersService(req.params.assignmentId, req.user!.id, answers);

    res.status(HTTPSTATUS.OK).json({
      message: "Assignment submitted successfully",
      data: result,
    });
  }
);

export const getMyAttemptController = asyncHandler(
  async (req: Request, res: Response) => {
    const attempt = await getMyAssignmentAttemptService(req.params.attemptId, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Attempt retrieved successfully",
      data: attempt,
    });
  }
);

export const getMyAttemptsForAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const attempts = await getMyAssignmentAttemptsForAssignmentService(req.params.assignmentId, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Attempts retrieved successfully",
      data: attempts,
    });
  }
);