import API from "@/services/axios-client";
import {
  getAccountResponseType,
  updateAccountMultipartPayload,
  updateAccountResponseType,
} from "@/types/api/app/account.type";

export const getAccountMutationFn = async (
  _userId: string
): Promise<getAccountResponseType> => {
  const response = await API.get(`/admin/settings/account`);
  return response.data;
};

export const updateAccountMutationFn = async (
  _userId: string,
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
  const response = await API.patch(`/admin/settings/account`, fd);
  return response.data;
};

