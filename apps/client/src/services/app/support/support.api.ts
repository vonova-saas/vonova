import API from "@/services/axios-client";
import { addSupportMessageRequestType, addSupportMessageResponseType, addSupportTicketResponseType, addSupportTicketType, deleteSupportTicketResponseType, getSupportMessagesResponseType, getSupportTicketByIdResponseType, getSupportTicketResponseType, updateSupportStatusRequestType, updateSupportStatusResponseType, updateSupportTicketResponseType, updateSupportTicketType } from "@/types/api/app/support/support.type";

export const addSupportTicketMutationFn = async (
  userId: string,
  data: addSupportTicketType
): Promise<addSupportTicketResponseType> => {
  const response = await API.post(`/api/v1/app/support/${userId}/add`, data);
  return response.data;
};

export const getSupportTicketMutationFn = async (
  userId: string
): Promise<getSupportTicketResponseType> => {
  const response = await API.get(`/api/v1/app/support/${userId}`);
  return response.data;
};

export const getSupportTicketByIdMutationFn = async (
  userId: string,
  id: string
): Promise<getSupportTicketByIdResponseType> => {
  const response = await API.get(`/api/v1/app/support/${userId}/${id}`);
  return response.data;
};

export const updateSupportTicketMutationFn = async (
  userId: string,
  id: string,
  data: updateSupportTicketType
): Promise<updateSupportTicketResponseType> => {
  const response = await API.put(`/api/v1/app/support/${userId}/${id}`, data);
  return response.data;
};

export const deleteSupportTicketMutationFn = async (
  userId: string,
  id: string
): Promise<deleteSupportTicketResponseType> => {
  const response = await API.delete(`/api/v1/app/support/${userId}/${id}`);
  return response.data;
};

// ==================== User Support Messages ====================
export const addSupportMessageMutationFn = async (
  userId: string,
  id: string,
  data: addSupportMessageRequestType
): Promise<addSupportMessageResponseType> => {
  const response = await API.post(`/api/v1/app/support/${userId}/${id}/messages`, data);
  return response.data;
};

export const getSupportMessagesQueryFn = async (
  userId: string,
  id: string
): Promise<getSupportMessagesResponseType> => {
  const response = await API.get(`/api/v1/app/support/${userId}/${id}/messages`);
  return response.data;
};

// Status update
export const updateSupportStatusMutationFn = async (
  userId: string,
  id: string,
  data: updateSupportStatusRequestType
): Promise<updateSupportStatusResponseType> => {
  const response = await API.put(`/api/v1/app/support/${userId}/${id}/status`, data);
  return response.data;
};
