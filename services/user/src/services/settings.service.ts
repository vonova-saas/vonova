import UserSettingsModel from "../models/userSettings.model";
import { NotFoundException } from "../utils/appError";

//! ============ User settings Service ============
export const getUserSettingsService = async (userId: string) => {
  const settings = await UserSettingsModel.findOne({ userId });
  if (!settings) {
    throw new NotFoundException("User settings not found");
  }
  return settings;
};

export const updateUserSettingsService = async (userId: string, update: any) => {
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!settings) {
    throw new NotFoundException("User settings not found");
  }
  return settings;
};
