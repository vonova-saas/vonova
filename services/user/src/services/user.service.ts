import UserProfileModel from "../models/userProfile.model";
import UserSettingsModel from "../models/userSettings.model";
import DashboardDataModel from "../models/dashboardData.model";
import { NotFoundException } from "../utils/appError";

export const getUserProfileService = async (userId: string) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) throw new NotFoundException("User profile not found");
  return profile;
};

export const updateUserProfileService = async (userId: string, update: any) => {
  const profile = await UserProfileModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!profile) throw new NotFoundException("User profile not found");
  return profile;
};

export const getUserSettingsService = async (userId: string) => {
  const settings = await UserSettingsModel.findOne({ userId });
  if (!settings) throw new NotFoundException("User settings not found");
  return settings;
};

export const updateUserSettingsService = async (userId: string, update: any) => {
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!settings) throw new NotFoundException("User settings not found");
  return settings;
};

export const getDashboardDataService = async (userId: string) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) throw new NotFoundException("Dashboard data not found");
  return dashboard;
};

export const updateDashboardDataService = async (userId: string, update: any) => {
  const dashboard = await DashboardDataModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!dashboard) throw new NotFoundException("Dashboard data not found");
  return dashboard;
};
