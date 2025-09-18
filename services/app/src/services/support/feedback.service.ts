import UserFeedbackModel from "../../models/support/userFeedback.modle";
import { NotFoundException } from "../../utils/appError";

//! ============ User FeedBack Service ============
export const addUserFeedbackService = async (userId: string, newFeedBack: any) => {
  const feedBack = await UserFeedbackModel.create({ userId, ...newFeedBack });

  if (!feedBack) {
    throw new NotFoundException("User feedback not found");
  }

  return feedBack;
};

export const getUserFeedbacksService = async (userId: string) => {
  const feedBack = await UserFeedbackModel.find({ userId });

  if (!feedBack) {
    throw new NotFoundException("User feedback not found");
  }

  return feedBack;
};

export const getUserFeedbackByIdService = async (userId: string, id: string) => {
  const feedBack = await UserFeedbackModel.findById(id);

  if (!feedBack) {
    throw new NotFoundException("User feedback not found");
  }

  return feedBack;
};

export const updateUserFeedbackService = async (userId: string, id: string, update: any) => {
  const feedBack = await UserFeedbackModel.findOneAndUpdate(
    { userId, _id: id },
    { $set: update },
    { upsert: true, runValidators: true }
  ).lean();

  if (!feedBack) {
    throw new NotFoundException("User feedback not found");
  }

  return feedBack;
};

export const deleteUserFeedbackService = async (userId: string, id: string) => {
  const feedBack = await UserFeedbackModel.findByIdAndDelete(id);

  if (!feedBack) {
    throw new NotFoundException("User feedback not found");
  }

  return "Feedback deleted successfully";
};