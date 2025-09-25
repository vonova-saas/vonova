import { Request, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import {
  addUserFeedbackService,
  deleteUserFeedbackService,
  getUserFeedbackByIdService,
  getUserFeedbacksService,
  updateUserFeedbackService,
  addUserFeedbackMessageService,
  getUserFeedbackMessagesService,
  updateUserFeedbackStatusService
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

// ==================== Feedback Messages User Side Controllers ====================
export const addUserFeedbackMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const messages = await addUserFeedbackMessageService(userId, id, req.body.message, 'user');

    return res.status(HTTPSTATUS.OK).json({
      message: "Message added successfully",
      data: messages,
    });
  }
);

export const getUserFeedbackMessagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const messages = await getUserFeedbackMessagesService(userId, id);

    return res.status(HTTPSTATUS.OK).json({
      message: "Messages fetched successfully",
      data: messages,
    });
  }
);

export const updateUserFeedbackStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, id } = req.params;
    const updated = await updateUserFeedbackStatusService(userId, id, req.body.status);

    return res.status(HTTPSTATUS.OK).json({
      message: "Status updated successfully",
      data: updated,
    });
  }
);