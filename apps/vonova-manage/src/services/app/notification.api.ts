import API from "@/services/axios-client";
import { getNotificationResponseType, resetNotificationResponseType, updateNotificationResponseType, updateNotificationType } from "@/types/api/app/notification.type";

export const getNotificationMutationFn = async (
  _userId: string
): Promise<getNotificationResponseType> => {
  const response = await API.get(`/admin/settings/notifications`);
  return response.data;
};

export const updateNotificationMutationFn = async (
  _userId: string,
  data: updateNotificationType
): Promise<updateNotificationResponseType> => {
  const response = await API.patch(`/admin/settings/notifications`, data);
  return response.data;
};

export const resetNotificationMutationFn = async (
  _userId: string
): Promise<resetNotificationResponseType> => {
  const response = await API.post(`/admin/settings/notifications/reset`);
  return response.data;
};
