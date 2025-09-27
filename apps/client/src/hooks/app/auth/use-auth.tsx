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
        if (error?.response?.status === 401) {
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
    staleTime: 0,
    retry: 2,
  });
};

export default useAuth;
