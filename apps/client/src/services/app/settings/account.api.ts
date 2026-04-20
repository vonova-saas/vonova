import API from "@/services/axios-client";
import {
  getAccountResponseType,
  updateAccountMultipartPayload,
  updateAccountResponseType,
} from "@/types/api/app/settings/account.type";

export const getAccountMutationFn = async (
  userId: string
): Promise<getAccountResponseType> => {
  const response = await API.get(`/account/user/${userId}`);
  return response.data;
};

export const updateAccountMutationFn = async (
  userId: string,
  data: updateAccountMultipartPayload
): Promise<updateAccountResponseType> => {
  const fd = new FormData();
  fd.append("name", data.name);
  fd.append("bio", data.bio);
  fd.append("address", data.address);
  if (data.dateOfBirth) {
    fd.append("dateOfBirth", data.dateOfBirth);
  }
  if (data.file) {
    fd.append("file", data.file);
  }
  const response = await API.put(`/account/user/${userId}`, fd);
  return response.data;
};

