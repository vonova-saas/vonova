import useAuth from "./use-auth";

export type RoleType = string; // Backend returns strings like "STUDENT_USER"

type Authorization = {
  userId?: string;
  role?: RoleType;
  isAuthenticated: boolean;
  // helpers
  isRole: (roles: RoleType | RoleType[]) => boolean;
};

export default function useAuthorization(): Authorization {
  const { data } = useAuth();
  const user = data?.user;

  const role = user?.role as RoleType | undefined;
  const isAuthenticated = Boolean(user?._id);

  const isRole = (r: RoleType | RoleType[]) => {
    if (!role) return false;
    return Array.isArray(r) ? r.includes(role) : role === r;
  };

  return {
    userId: user?._id,
    role,
    isAuthenticated,
    isRole,
  };
}
