import API from "@/services/axios-client";
import { getNotificationResponseType, resetNotificationResponseType, updateNotificationResponseType, updateNotificationType } from "@/types/api/app/settings/notification.type";

export const getNotificationMutationFn = async (
  userId: string
): Promise<getNotificationResponseType> => {
  const response = await API.get(`/api/v1/app/notification/${userId}`);
  return response.data;
};

export const updateNotificationMutationFn = async (
  userId: string,
  data: updateNotificationType
): Promise<updateNotificationResponseType> => {
  const response = await API.put(`/api/v1/app/notification/${userId}`, data);
  return response.data;
};

export const resetNotificationMutationFn = async (
  userId: string
): Promise<resetNotificationResponseType> => {
  const response = await API.get(`/api/v1/app/notification/${userId}/reset`);
  return response.data;
};
