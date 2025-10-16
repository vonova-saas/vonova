import API from "@/services/axios-client";
import { generateRoadmapType, generateRoadmapTypeResponse } from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

// ========== Roadmap Generator API Endpoints ==========
export const generateRoadmapMutationFn = async (
  roadmapData: generateRoadmapType,
): Promise<generateRoadmapTypeResponse> => {
  const response = await API.post(`/api/v1/lms-ai/roadmap-generator/generateRoadmap`, roadmapData);
  return response.data;
};

export const getRoadmapByIdMutationFn = async (
  roadmapId: string,
): Promise<generateRoadmapTypeResponse> => {
  const response = await API.get(`/api/v1/lms-ai/roadmap-generator/getRoadmap/${roadmapId}`);
  return response.data;
};
