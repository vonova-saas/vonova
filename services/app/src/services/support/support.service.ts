import UserSupportModel from "../../models/support/userSupport.model";
import { NotFoundException } from "../../utils/appError";

//! ============ User Support Service ============
export const addUserSupportService = async (userId: string, newSupport: any) => {
  const support = await UserSupportModel.create({ userId, ...newSupport });

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return support;
};

export const getUserSupportsService = async (userId: string) => {
  const support = await UserSupportModel.find({ userId });

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return support;
};

export const getUserSupportByIdService = async (userId: string, id: string) => {
  const support = await UserSupportModel.findById(id);

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return support;
};

export const updateUserSupportService = async (userId: string, id: string, update: any) => {
  const support = await UserSupportModel.findOneAndUpdate(
    { userId, _id: id },
    { $set: update },
    { upsert: true, runValidators: true }
  ).lean();

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return support;
};

export const deleteUserSupportService = async (userId: string, id: string) => {
  const support = await UserSupportModel.findByIdAndDelete(id);

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return "Support deleted successfully";
};

//? ==================== Support Messages User Side Services ====================
export const addUserSupportMessageService = async (
  userId: string,
  id: string,
  message: string,
  sender: 'user' | 'agent' = 'user'
) => {
  const support = await UserSupportModel.findOneAndUpdate(
    { _id: id, userId },
    {
      $push: { messages: { sender, message, createdAt: new Date() } },
      $set: { updatedAt: new Date() },
    },
    { new: true, runValidators: true }
  );

  if (!support) {
    throw new NotFoundException("User support not found");
  }

  return support.messages;
};

export const getUserSupportMessagesService = async (userId: string, id: string) => {
  const support = await UserSupportModel.findOne({ _id: id, userId }, { messages: 1 }).lean();
  if (!support) {
    throw new NotFoundException("User support not found");
  }
  return support.messages || [];
};

export const updateUserSupportStatusService = async (
  userId: string,
  id: string,
  status: 'open' | 'pending' | 'resolved' | 'closed'
) => {
  const support = await UserSupportModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();

  if (!support) {
    throw new NotFoundException("User support not found");
  }
  return support;
};