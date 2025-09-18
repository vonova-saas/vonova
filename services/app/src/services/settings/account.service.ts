import UserAccountModel from "../../models/settings/userAccount.model";
import { NotFoundException } from "../../utils/appError";

//! ============ User Account Service ============
export const getUserAccountService = async (userId: string) => {
  const account = await UserAccountModel.findOne({ userId });

  if (!account) {
    throw new NotFoundException("User account not found");
  }

  return account;
};

export const updateUserAccountService = async (userId: string, update: any) => {
  const account = await UserAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, runValidators: true }
  ).lean();

  if (!account) {
    throw new NotFoundException("User account not found");
  }

  return account;
};
