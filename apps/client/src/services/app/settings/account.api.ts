import API from "@/services/axios-client";
import { getAccountResponseType, updateAccountResponseType, updateAccountType } from "@/types/api/app/settings/account.type";

export const getAccountMutationFn = async (
  userId: string
): Promise<getAccountResponseType> => {
  const response = await API.get(`/account/user/${userId}`);
  return response.data;
};

export const updateAccountMutationFn = async (
  userId: string,
  data: updateAccountType
): Promise<updateAccountResponseType> => {
  const response = await API.put(`/account/user/${userId}`, data);
  return response.data;
};

