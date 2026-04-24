import API from "@/services/axios-client";
import { getSettingsResponseType, resetSettingsResponseType, updateSettingsResponseType, updateSettingsType } from "@/types/api/app/settings.type";

export const getSettingsMutationFn = async (
  _userId: string
): Promise<getSettingsResponseType> => {
  const response = await API.get(`/admin/settings`);
  return response.data;
};

export const updateSettingsMutationFn = async (
  _userId: string,
  data: updateSettingsType
): Promise<updateSettingsResponseType> => {
  const response = await API.patch(`/admin/settings`, data);
  return response.data;
};

export const resetSettingsMutationFn = async (
  _userId: string
): Promise<resetSettingsResponseType> => {
  const response = await API.post(`/admin/settings/reset`);
  return response.data;
};
