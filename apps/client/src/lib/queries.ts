/* eslint-disable @typescript-eslint/no-explicit-any */
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
        data: variables.body,
      }).then((response: AxiosResponse) => response.data);
    },
    ...options,
  });
};

export const useGenerateRoadmap = (
  options?: MutationOptions,
) => {
  return MutationFactory(
    ["Generate Roadmap"],
    `${process.env.NEXT_PUBLIC_API_URL}/generate-roadmap`,
    "POST",
    options,
  );
};
