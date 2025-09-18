import { Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import {
  addUserFeedbackService,
  deleteUserFeedbackService,
  getUserFeedbackByIdService,
  getUserFeedbacksService,
  updateUserFeedbackService
} from "../../services/support/feedback.service";

// ============ User Feedback Controllers ============
export const addUserFeedbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const feedback = await addUserFeedbackService(userId, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User feedback added successfully",
      data: feedback,
    });
  }
);

export const getUserFeedbacksController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const feedbacks = await getUserFeedbacksService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User feedbacks fetched successfully",
      data: feedbacks,
    });
  }
);

export const getUserFeedbackByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const feedback = await getUserFeedbackByIdService(userId, req.params.id);

    return res.status(HTTPSTATUS.OK).json({
      message: "User feedback fetched successfully",
      data: feedback,
    });
  }
);

export const updateUserFeedbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const feedback = await updateUserFeedbackService(userId, req.params.id, req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: "User feedback updated successfully",
      data: feedback,
    });
  }
);

export const deleteUserFeedbackController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const feedback = await deleteUserFeedbackService(userId, req.params.id);

    return res.status(HTTPSTATUS.OK).json({
      message: feedback,
    });
  }
);