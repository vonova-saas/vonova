export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserQuery extends PaginationQuery {
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserUpdatePayload {
  adminUserId: string;
  targetUserId: string;
  newRole: string;
}

export interface UserStatusTogglePayload {
  adminUserId: string;
  targetUserId: string;
  isActive: boolean;
}

export interface UserDeletePayload {
  adminUserId: string;
  targetUserId: string;
}

export interface StatisticsPayload {
  type: 'users' | 'instructors' | 'students';
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface AppInfoResponse {
  name: string;
  version: string;
  description: string;
  status: string;
  timestamp: string;
}
