import API from "@/services/axios-client";
import type {
  BulkDeleteRoadmapsRequest,
  BulkDeleteRoadmapsResponse,
  DeleteRoadmapResponse,
  GenerateRoadmapRequest,
  RoadmapAiConnectionResponse,
  RoadmapHealthResponse,
  RoadmapHistoryResponse,
  RoadmapPayload,
  RoadmapQueryAnalyticsResponse,
  RoadmapServiceStatsResponse,
  RoadmapSystemStatusResponse,
  UpdateRoadmapProgressRequest,
  UpdateRoadmapProgressResponse,
  UserRoadmapsResponse,
} from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

const ROADMAP_BASE = "/roadmap";

export const generateRoadmapMutationFn = async (
  roadmapData: GenerateRoadmapRequest,
): Promise<RoadmapPayload> => {
  const response = await API.post(`${ROADMAP_BASE}/generate`, roadmapData, {
    timeout: 120000,
  });
  return response.data;
};

export const getRoadmapByIdMutationFn = async (
  roadmapId: string,
): Promise<RoadmapPayload> => {
  const response = await API.get(`${ROADMAP_BASE}/${roadmapId}`);
  return response.data;
};

export const getUserRoadmapsMutationFn =
  async (): Promise<UserRoadmapsResponse> => {
    const response = await API.get(`${ROADMAP_BASE}/user-roadmaps`);
    return response.data;
  };

export const updateRoadmapMutationFn = async (
  roadmapId: string,
  roadmapData: UpdateRoadmapProgressRequest,
): Promise<UpdateRoadmapProgressResponse> => {
  const response = await API.put(
    `${ROADMAP_BASE}/${roadmapId}/progress`,
    roadmapData,
  );
  return response.data;
};

export const deleteRoadmapMutationFn = async (
  roadmapId: string,
): Promise<DeleteRoadmapResponse> => {
  const response = await API.delete(`${ROADMAP_BASE}/${roadmapId}`);
  return response.data;
};

export const getRoadmapHealthMutationFn =
  async (): Promise<RoadmapHealthResponse> => {
    const response = await API.get(`${ROADMAP_BASE}/health`);
    return response.data;
  };

export const getRoadmapStatsMutationFn =
  async (): Promise<RoadmapServiceStatsResponse> => {
    const response = await API.get(`${ROADMAP_BASE}/stats`);
    return response.data;
  };

export const testRoadmapAiConnectionMutationFn =
  async (): Promise<RoadmapAiConnectionResponse> => {
    const response = await API.get(`${ROADMAP_BASE}/test-ai-connection`);
    return response.data;
  };

export const getRoadmapSystemStatusMutationFn =
  async (): Promise<RoadmapSystemStatusResponse> => {
    const response = await API.get(`${ROADMAP_BASE}/system-status`);
    return response.data;
  };

export const bulkDeleteRoadmapsMutationFn = async (
  body: BulkDeleteRoadmapsRequest,
): Promise<BulkDeleteRoadmapsResponse> => {
  const response = await API.post(`${ROADMAP_BASE}/batch/delete`, body);
  return response.data;
};

export const getRoadmapQueryAnalyticsMutationFn = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<RoadmapQueryAnalyticsResponse> => {
  const response = await API.get(`${ROADMAP_BASE}/analytics/queries`, {
    params,
  });
  return response.data;
};

export const getRoadmapHistoryMutationFn = async (
  roadmapId: string,
  params?: { page?: string; limit?: string },
): Promise<RoadmapHistoryResponse> => {
  const response = await API.get(`${ROADMAP_BASE}/${roadmapId}/history`, {
    params,
  });
  return response.data;
};

export const getMyUsageQueryFn = async (): Promise<{
  date: string;
  timezone: string;
  ai_roadmap: { used: number; limit: number | null; remaining: number | null };
  pdf_summary: { used: number; limit: number | null; remaining: number | null };
  pdf_voice: { used: number; limit: number | null; remaining: number | null };
}> => {
  const response = await API.get('/me/usage');
  return response.data;
};
