/* eslint-disable @typescript-eslint/no-explicit-any */
import useAuth from "@/hooks/app/auth/use-auth";
import { MutationOptions, QueryKey, useMutation } from "@tanstack/react-query";
import axios, { AxiosError, AxiosResponse } from "axios";

const MutationFactory = (
  mutationKey: QueryKey,
  url: string,
  method: "POST" | "PUT" | "PATCH",
  options?: MutationOptions,
) => {
  return useMutation<any, AxiosError, any>({
    mutationKey,
    mutationFn: async (variables: { body: any }) => {
      return axios({
        url,
        method,
        withCredentials: true,
        timeout: 60000, // Increased to 60 seconds for AI processing
        data: variables.body,
      }).then((response: AxiosResponse) => response.data);
    },
    ...options,
  });
};

export const useGenerateRoadmap = (
  options?: MutationOptions,
) => {
  const { data: authData } = useAuth();
  const userId = authData?.user?._id;
  return MutationFactory(
    ["Generate Roadmap"],
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/roadmap/generate?userId=${userId}`,
    "POST",
    options,
  );
};
