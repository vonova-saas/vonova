import UserNotificationModel from "../../models/settings/userNotification.model";
import { NotFoundException } from "../../utils/appError";

//! ============ User Notification Service ============
export const getDefaultNotification = () => ({
  notifyMe: "all",
  communicationEmails: true,
  marketingEmails: true,
  socialEmails: true,
  securityEmails: true,
});

export const getUserNotificationService = async (userId: string) => {
  let notification = await UserNotificationModel.findOne({ userId });

  if (!notification) {
    notification = await UserNotificationModel.create({
      userId,
      ...getDefaultNotification(),
    });
  }

  return notification;
};

export const updateUserNotificationService = async (userId: string, update: any) => {
  const notification = await UserNotificationModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, runValidators: true, new: true }
  ).lean();

  if (!notification) {
    throw new NotFoundException("User notification not found");
  }

  return notification;
};

export const resetUserNotificationService = async (userId: string) => {
  const notification = await UserNotificationModel.findOneAndUpdate(
    { userId },
    { $set: getDefaultNotification() },
    { runValidators: true, new: true }
  ).lean();

  if (!notification) {
    throw new NotFoundException("User notification not found");
  }

  return notification;
};