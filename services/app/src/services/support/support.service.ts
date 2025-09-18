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