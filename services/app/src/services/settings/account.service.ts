import UserAccountModel from "../../models/settings/userAccount.model";
import { NotFoundException } from "../../utils/appError";
import mongoose from "mongoose";

//! ============ User Account Service ============
export const getUserAccountService = async (
  userId: string,
  defaults?: { name?: string; email?: string; avatarUrl?: string }
) => {
  // Try to find existing account first
  let account = await UserAccountModel.findOne({ userId });

  if (!account) {
    // Lazily initialize a default account if we have sufficient info
    const name = defaults?.name || "";
    const email = defaults?.email || "";

    if (name && email) {
      account = await UserAccountModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        name,
        email,
        avatarUrl: defaults?.avatarUrl || null,
      });
    } else {
      // Missing required fields to create a default account
      throw new NotFoundException("User account not found");
    }
  }

  return account;
};

export const updateUserAccountService = async (userId: string, update: any) => {
  const account = await UserAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, runValidators: true, new: true }
  ).lean();

  if (!account) {
    throw new NotFoundException("User account not found");
  }

  return account;
};
