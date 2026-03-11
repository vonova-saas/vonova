import API from "@/services/axios-client";
import {
  addFeedbackMessageRequestType,
  addFeedbackMessageResponseType,
  addFeedbackResponseType,
  addFeedbackType,
  getFeedbackMessagesResponseType,
  getFeedbackResponseType,
  deleteFeedbackResponseType,
  updateFeedbackResponseType,
  updateFeedbackStatusRequestType,
  updateFeedbackStatusResponseType,
  updateFeedbackType,
  getFeedbackByIdResponseType
} from "@/types/api/app/feedback/feedback.type";

export const addFeedbackMutationFn = async (
  userId: string,
  data: addFeedbackType
): Promise<addFeedbackResponseType> => {
  const response = await API.post(`/feedback/user/${userId}`, data);
  return response.data;
};

export const getFeedbackMutationFn = async (
  userId: string
): Promise<getFeedbackResponseType> => {
  const response = await API.get(`/feedback/user/${userId}`);
  return response.data;
};

export const getFeedbackByIdMutationFn = async (
  userId: string,
  id: string
): Promise<getFeedbackByIdResponseType> => {
  const response = await API.get(`/feedback/user/${userId}/${id}`);
  return response.data;
};

export const updateFeedbackMutationFn = async (
  userId: string,
  id: string,
  data: updateFeedbackType
): Promise<updateFeedbackResponseType> => {
  const response = await API.put(`/feedback/user/${userId}/${id}`, data);
  return response.data;
};

export const deleteFeedbackMutationFn = async (
  userId: string,
  id: string
): Promise<deleteFeedbackResponseType> => {
  const response = await API.delete(`/feedback/user/${userId}`);
  return response.data;
};

// ==================== User Feedback Messages ====================
export const addFeedbackMessageMutationFn = async (
  userId: string,
  id: string,
  data: addFeedbackMessageRequestType
): Promise<addFeedbackMessageResponseType> => {
  const response = await API.post(`/feedback/user/${userId}/${id}/messages`, data);
  return response.data;
};

export const getFeedbackMessagesQueryFn = async (
  userId: string,
  id: string
): Promise<getFeedbackMessagesResponseType> => {
  const response = await API.get(`/feedback/user/${userId}/${id}/messages`);
  return response.data;
};

// Status update
export const updateFeedbackStatusMutationFn = async (
  userId: string,
  id: string,
  data: updateFeedbackStatusRequestType
): Promise<updateFeedbackStatusResponseType> => {
  const response = await API.put(`/feedback/user/${userId}/${id}/status`, data);
  return response.data;
};
