import API from "@/services/axios-client";
import { getBillingResponseType, updateBillingResponseType, updateBillingType } from "@/types/api/app/settings/billing.type";

export const getBillingMutationFn = async (
  userId: string
): Promise<getBillingResponseType> => {
  const response = await API.get(`/api/v1/app/billing/${userId}`);
  return response.data;
};

export const updateBillingMutationFn = async (
  userId: string,
  data: updateBillingType
): Promise<updateBillingResponseType> => {
  const response = await API.put(`/api/v1/app/billing/${userId}`, data);
  return response.data;
};
