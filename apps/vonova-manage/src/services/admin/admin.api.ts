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
  DashboardOverviewResponse,
  DashboardOverviewRange,
  LoggingMonitoringResponse,
  MonitoringRange,
  MonitoringLevel,
  PerformanceMetricsResponse,
  UserManagementOverviewResponse,
  SupportTicketsResponse,
  SupportAnalyticsResponse,
  SecurityLogsResponse,
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

export const getDashboardOverviewQueryFn = async (params: {
  range: DashboardOverviewRange;
  customDate?: string;
}): Promise<DashboardOverviewResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("range", params.range);
  if (params.customDate) queryParams.append("customDate", params.customDate);
  const response = await API.get(`/admin/dashboard/overview?${queryParams.toString()}`);
  return response.data;
};

export const getLoggingMonitoringQueryFn = async (params: {
  range: MonitoringRange;
  customDate?: string;
  search?: string;
  levels?: MonitoringLevel[];
  sources?: string[];
  limit?: number;
}): Promise<LoggingMonitoringResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("range", params.range);
  if (params.customDate) queryParams.append("customDate", params.customDate);
  if (params.search) queryParams.append("search", params.search);
  if (params.levels?.length) queryParams.append("levels", params.levels.join(","));
  if (params.sources?.length) queryParams.append("sources", params.sources.join(","));
  if (params.limit) queryParams.append("limit", String(params.limit));
  const response = await API.get(`/admin/logging-monitoring?${queryParams.toString()}`);
  return response.data;
};

export const getPerformanceMetricsQueryFn = async (params: {
  range: '24h' | '7d' | '30d' | 'custom';
  customDate?: string;
}): Promise<PerformanceMetricsResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("range", params.range);
  if (params.customDate) queryParams.append("customDate", params.customDate);
  const response = await API.get(`/admin/performance-metrics?${queryParams.toString()}`);
  return response.data;
};

export const getUserManagementOverviewQueryFn = async (): Promise<UserManagementOverviewResponse> => {
  const response = await API.get("/admin/user-management/overview");
  return response.data;
};

export const getSupportTicketsQueryFn = async (params: {
  page?: number;
  limit?: number;
  status?: 'OPEN' | 'REPLIED';
  search?: string;
}): Promise<SupportTicketsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);
  const response = await API.get(`/admin/support/tickets?${queryParams.toString()}`);
  return response.data;
};

export const getSupportAnalyticsQueryFn = async (): Promise<SupportAnalyticsResponse> => {
  const response = await API.get("/admin/support/analytics");
  return response.data;
};

export const replySupportTicketMutationFn = async (params: {
  ticketId: string;
  adminReply: string;
}) => {
  const response = await API.patch(`/admin/support/${params.ticketId}/reply`, {
    adminReply: params.adminReply,
  });
  return response.data;
};

export const getSecurityLogsQueryFn = async (params: {
  range: '24h' | '7d' | '30d' | 'custom';
  customDate?: string;
  search?: string;
  limit?: number;
}): Promise<SecurityLogsResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("range", params.range);
  if (params.customDate) queryParams.append("customDate", params.customDate);
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", String(params.limit));
  const response = await API.get(`/admin/security-logs?${queryParams.toString()}`);
  return response.data;
};
