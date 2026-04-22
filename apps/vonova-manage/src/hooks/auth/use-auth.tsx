import { adminCurrentUserQueryFn, adminRefreshTokenMutationFn } from "@/services";
import { useQuery } from "@tanstack/react-query";

const useAuth = () => {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        return await adminCurrentUserQueryFn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const status = error?.response?.status;
        const message = (error?.response?.data?.message || "").toLowerCase();
        const shouldAttemptRefresh =
          status === 401 || (status === 400 && message.includes("access token cookie is required"));

        if (shouldAttemptRefresh) {
          // Try to refresh token
          try {
            await adminRefreshTokenMutationFn();
            // Retry original request
            return await adminCurrentUserQueryFn();
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
