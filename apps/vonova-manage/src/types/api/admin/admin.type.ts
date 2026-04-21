//**************** Admin API TYPES ***************
// ******************************************

//? ============= Admin User Types =============
export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastSeenAt: string;
  isOnline: boolean;
  isActive: boolean;
  isVerified: string;
  createdAt: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type GetUsersResponse = {
  success: boolean;
  message: string;
  data: {
    users: AdminUser[];
    pagination: PaginationInfo;
  };
};

export type GetUsersParams = {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
};

//? ============= Get Single User Types =============
export type GetUserResponse = {
  success: boolean;
  message: string;
  data: AdminUser;
};

//? ============= Update User Status Types =============
export type UpdateUserStatusRequest = {
  userId: string;
  isActive: boolean;
};

export type UpdateUserStatusResponse = {
  success: boolean;
  message: string;
  data: {
    updated: boolean;
  };
};

//? ============= Pending Instructors Types =============
export type PendingInstructorUser = {
  _id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstructorOnboarding = {
  instructor: {
    track: string;
    experienceYears: number;
    bio: string;
    teachingStyle: string;
    motivation: string;
  };
};

export type PendingInstructor = {
  user: PendingInstructorUser;
  onboarding: InstructorOnboarding;
  cvUrl: string;
};

export type GetPendingInstructorsResponse = {
  message: string;
  data: {
    instructors: PendingInstructor[];
  };
};

//? ============= Approve Instructor Types =============
export type ApproveInstructorResponse = {
  message: string;
  data: {
    userId: string;
    status: string;
  };
};

//? ============= Reject Instructor Types =============
export type RejectInstructorResponse = {
  message: string;
  data: {
    userId: string;
    status: string;
  };
};
