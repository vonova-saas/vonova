import { getCurrentUserQueryFn, refreshTokenMutationFn } from "@/services";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        return await getCurrentUserQueryFn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const status = error?.response?.status;
        const message = (error?.response?.data?.message || "").toLowerCase();
        const shouldAttemptRefresh =
          status === 401 || (status === 400 && message.includes("access token cookie is required"));

        if (shouldAttemptRefresh) {
          // Try to refresh token
          try {
            await refreshTokenMutationFn();
            // Retry original request
            return await getCurrentUserQueryFn();
          } catch {
            throw error;
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min - avoid refetch on every navigation
    retry: 2,
  });
};

export default useAuth;
