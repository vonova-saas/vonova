import API from "@/services/axios-client";
import { generateRoadmapType, generateRoadmapTypeResponse, updateRoadmapProgressType, deleteRoadmapType, getUserRoadmapsTypeResponse } from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

// ========== Roadmap Generator API Endpoints ==========
export const generateRoadmapMutationFn = async (
  roadmapData: generateRoadmapType,
): Promise<generateRoadmapTypeResponse> => {
  const response = await API.post(`/roadmap/generate`, roadmapData);
  return response.data;
};

export const getRoadmapByIdMutationFn = async (
  roadmapId: string,
): Promise<generateRoadmapTypeResponse> => {
  const response = await API.get(`/roadmap/${roadmapId}`);
  return response.data;
};

export const getUserRoadmapsMutationFn = async (
  userId: string,
): Promise<getUserRoadmapsTypeResponse> => {
  const response = await API.get(`/roadmap/user-roadmaps?userId=${userId}`);
  return response.data;
};

export const updateRoadmapMutationFn = async (
  roadmapId: string,
  roadmapData: updateRoadmapProgressType,
): Promise<generateRoadmapTypeResponse> => {
  const response = await API.put(`/roadmap/${roadmapId}/progress`, roadmapData);
  return response.data;
};

export const deleteRoadmapMutationFn = async (
  roadmapId: string,
): Promise<deleteRoadmapType> => {
  const response = await API.delete(`/roadmap/${roadmapId}`);
  return response.data;
};


