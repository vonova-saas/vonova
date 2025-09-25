import UserSettingsModel from "../../models/settings/userSettings.model";
import { NotFoundException } from "../../utils/appError";

//! ============ User settings Service ============
export const getDefaultSettings = () => ({
  font: "cairo",
  fontSize: "16",
  theme: "light",
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: "MM/DD/YYYY",
});

export const getUserSettingsService = async (userId: string) => {
  let settings = await UserSettingsModel.findOne({ userId });

  if (!settings) {
    settings = await UserSettingsModel.create({
      userId,
      ...getDefaultSettings(),
    });
  }

  return settings;
};

export const updateUserSettingsService = async (userId: string, update: any) => {
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, runValidators: true, new: true }
  ).lean();

  if (!settings) {
    throw new NotFoundException("User settings not found");
  }

  return settings;
};

export const resetUserSettingsService = async (userId: string) => {
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: getDefaultSettings() },
    { runValidators: true, new: true }
  ).lean();

  if (!settings) {
    throw new NotFoundException("User settings not found");
  }

  return settings;
};