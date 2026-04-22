/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import API from "@/services/axios-client";
import type {
  GenerateRoadmapRequest,
  RoadmapPayload,
} from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

type GenerateRoadmapMutationOptions = Omit<
  UseMutationOptions<
    unknown,
    AxiosError,
    { body: GenerateRoadmapRequest }
  >,
  "mutationKey" | "mutationFn"
>;

export const useGenerateRoadmap = (options?: GenerateRoadmapMutationOptions) => {
  return useMutation<
    RoadmapPayload,
    AxiosError,
    { body: GenerateRoadmapRequest }
  >({
    mutationKey: ["Generate Roadmap"],
    mutationFn: async ({ body }) => {
      const response = await API.post<RoadmapPayload>("/roadmap/generate", body, {
        timeout: 120000,
      });
      return response.data;
    },
    ...options,
  });
};
