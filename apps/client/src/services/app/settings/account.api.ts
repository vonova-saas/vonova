import API from "@/services/axios-client";
import { getAccountResponseType, updateAccountResponseType, updateAccountType } from "@/types/api/app/settings/account.type";

export const getAccountMutationFn = async (
  userId: string
): Promise<getAccountResponseType> => {
  const response = await API.get(`/api/v1/app/account/${userId}`);
  return response.data;
};

export const updateAccountMutationFn = async (
  userId: string,
  data: updateAccountType
): Promise<updateAccountResponseType> => {
  const response = await API.put(`/api/v1/app/account/${userId}`, data);
  return response.data;
};

