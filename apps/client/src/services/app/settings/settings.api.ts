import API from "@/services/axios-client";
import { getSettingsResponseType, resetSettingsResponseType, updateSettingsResponseType, updateSettingsType } from "@/types/api/app/settings/settings.type";

export const getSettingsMutationFn = async (
  userId: string
): Promise<getSettingsResponseType> => {
  const response = await API.get(`/settings/user/${userId}`);
  return response.data;
};

export const updateSettingsMutationFn = async (
  userId: string,
  data: updateSettingsType
): Promise<updateSettingsResponseType> => {
  const response = await API.put(`/settings/user/${userId}`, data);
  return response.data;
};

export const resetSettingsMutationFn = async (
  userId: string
): Promise<resetSettingsResponseType> => {
  const response = await API.get(`/settings/user/${userId}/reset`);
  return response.data;
};
