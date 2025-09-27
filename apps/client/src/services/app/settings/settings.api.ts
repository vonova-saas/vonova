import API from "@/services/axios-client";
import { getSettingsResponseType, resetSettingsResponseType, updateSettingsResponseType, updateSettingsType } from "@/types/api/app/settings/settings.type";

export const getSettingsMutationFn = async (
  userId: string
): Promise<getSettingsResponseType> => {
  const response = await API.get(`/api/v1/app/settings/${userId}`);
  return response.data;
};

export const updateSettingsMutationFn = async (
  userId: string,
  data: updateSettingsType
): Promise<updateSettingsResponseType> => {
  const response = await API.put(`/api/v1/app/settings/${userId}`, data);
  return response.data;
};

export const resetSettingsMutationFn = async (
  userId: string
): Promise<resetSettingsResponseType> => {
  const response = await API.get(`/api/v1/app/settings/${userId}/reset`);
  return response.data;
};
