import API from "@/services/axios-client";
import {
  GetUsersResponse,
  GetUsersParams,
  GetUserResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
  GetPendingInstructorsResponse,
  ApproveInstructorResponse,
  RejectInstructorResponse,
} from "@/types/api/admin/admin.type";

// ============= Admin User API Services =============

// Get all users with pagination and filters
export const getUsersQueryFn = async (
  params: GetUsersParams
): Promise<GetUsersResponse> => {
  const { page = 1, limit = 20, role, search } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (role) queryParams.append("role", role);
  if (search) queryParams.append("search", search);

  const response = await API.get(`/admin/users?${queryParams.toString()}`);
  return response.data;
};

// Get single user by ID
export const getUserQueryFn = async (
  userId: string
): Promise<GetUserResponse> => {
  const response = await API.get(`/admin/users/${userId}`);
  return response.data;
};

// Update user status (suspend/restore)
export const updateUserStatusMutationFn = async (
  data: UpdateUserStatusRequest
): Promise<UpdateUserStatusResponse> => {
  const response = await API.patch("/admin/users/status", data);
  return response.data;
};

// Get pending instructors for CV review
export const getPendingInstructorsQueryFn = async (): Promise<GetPendingInstructorsResponse> => {
  const response = await API.get("/admin/instructors/pending");
  return response.data;
};

// Approve instructor (set status from PENDING to ACTIVE)
export const approveInstructorMutationFn = async (
  instructorId: string
): Promise<ApproveInstructorResponse> => {
  const response = await API.patch(`/admin/instructors/${instructorId}/approve`);
  return response.data;
};

// Reject instructor (set status to REJECTED)
export const rejectInstructorMutationFn = async (
  instructorId: string
): Promise<RejectInstructorResponse> => {
  const response = await API.patch(`/admin/instructors/${instructorId}/reject`);
  return response.data;
};
