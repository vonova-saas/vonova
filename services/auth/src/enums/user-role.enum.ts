// Import from auth service or use identical values
export const UserRoleEnum = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR", 
  STUDENT: "STUDENT",
  PENDING: "PENDING"
} as const;

export type UserRoleType = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

// Simplified permissions for user service (auth service handles full permissions)
export const UserRolePermissions = {
  [UserRoleEnum.ADMIN]: [
    "MANAGE_ALL_USERS",
    "VIEW_ALL_PROFILES",
    "MANAGE_INSTRUCTORS",
    "MANAGE_STUDENTS",
    "VIEW_ANALYTICS",
    "ACCESS_ADMIN_DASHBOARD"
  ],
  [UserRoleEnum.INSTRUCTOR]: [
    "MANAGE_OWN_PROFILE",
    "VIEW_OWN_STUDENTS",
    "ACCESS_INSTRUCTOR_DASHBOARD"
  ],
  [UserRoleEnum.STUDENT]: [
    "MANAGE_OWN_PROFILE",
    "ACCESS_STUDENT_DASHBOARD"
  ],
  [UserRoleEnum.PENDING]: [
    "MANAGE_OWN_PROFILE"
  ]
} as const;

// Helper function to check if a role is valid
export const isValidUserRole = (role: string): role is UserRoleType => {
  return Object.values(UserRoleEnum).includes(role as UserRoleType);
};

// Helper function to get role permissions
export const getUserRolePermissions = (role: UserRoleType): readonly string[] => {
  return UserRolePermissions[role] || [];
};