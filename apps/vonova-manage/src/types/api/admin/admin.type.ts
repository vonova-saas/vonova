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

export type DashboardOverviewRange = '24h' | '7d' | '30d' | 'custom';

export type DashboardSeriesPoint = {
  x: string;
  y: number;
};

export type DashboardOverviewResponse = {
  success: boolean;
  message: string;
  data: {
    generatedAt: string;
    range: {
      key: DashboardOverviewRange;
      from: string;
      to: string;
    };
    metrics: {
      totalUsers: number;
      activeSessions: number;
      ticketsToday: number;
      avgResponseMs: number | null;
      activeUsers24h: number;
    };
    quickStats: {
      uptimePercent: number;
      uptimeSeconds: number;
      serverVersion: string;
      avgResponseMs: number | null;
      activeUsers24h: number;
    };
    resources: {
      cpu: { usedPercent: number; totalPercent: number };
      memory: { usedBytes: number; totalBytes: number };
      disk: { usedBytes: number; totalBytes: number } | null;
    };
    systemStatus: {
      api: 'operational' | 'degraded' | 'outage';
      database: 'operational' | 'degraded' | 'outage';
      authentication: 'operational' | 'degraded' | 'outage';
      fileStorage: 'operational' | 'degraded' | 'outage';
      workers: 'operational' | 'degraded' | 'outage';
    };
    performance: {
      responseTime: DashboardSeriesPoint[];
      errorRate: DashboardSeriesPoint[];
      requestStatus: {
        success: number;
        clientErrors: number;
        serverErrors: number;
        timeouts: number;
      };
    };
    recentActivity: Array<{
      id: string;
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      description: string;
      timestamp: string;
    }>;
    alerts: Array<{
      id: string;
      type: 'error' | 'warning' | 'info' | 'success';
      title: string;
      description: string;
      timestamp: string;
    }>;
  };
};

export type MonitoringRange = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom';
export type MonitoringLevel = 'error' | 'warning' | 'info' | 'debug' | 'trace';

export type LoggingMonitoringResponse = {
  success: boolean;
  message: string;
  data: {
    generatedAt: string;
    range: { key: MonitoringRange; from: string; to: string };
    summary: {
      totalLogs: number;
      errors: number;
      avgResponseMs: number | null;
      activeUsers: number;
      totalUsers: number;
    };
    logs: Array<{
      id: string;
      timestamp: string;
      level: MonitoringLevel;
      message: string;
      source: string;
      context?: Record<string, unknown>;
      stackTrace?: string;
    }>;
    sources: Array<{
      id: string;
      name: string;
      type: 'application' | 'database' | 'server' | 'service' | 'other';
      logCount: number;
      lastUpdated: string;
    }>;
    statsByLevel: Record<MonitoringLevel, number>;
    metrics: {
      responseTime: DashboardSeriesPoint[];
      errorRate: DashboardSeriesPoint[];
      requestVolume: DashboardSeriesPoint[];
      requestDistribution: Array<{ id: string; label: string; value: number }>;
    };
    alerts: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'critical' | 'warning';
      triggeredAt: string;
    }>;
  };
};

export type PerformanceMetricsResponse = {
  success: boolean;
  message: string;
  data: {
    generatedAt: string;
    range: { key: DashboardOverviewRange; from: string; to: string };
    overview: {
      responseTimeSeries: Array<{ x: string; xLabel: string; y: number }>;
      requestVolumeSeries: Array<{ x: string; xLabel: string; y: number }>;
      resources: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        totalCores: number;
        totalMemoryGb: number;
        totalDiskGb: number;
      };
    };
    server: {
      status: 'operational' | 'degraded' | 'outage';
      uptimeSeconds: number;
      activeProcesses: number;
      errorRate: number;
      performanceSeries: Array<{
        id: string;
        color: string;
        data: Array<{ x: string; y: number }>;
      }>;
    };
    database: {
      databaseSizeGb: number;
      queryCacheHitRate: number;
      activeConnections: number;
      maxConnections: number;
      replicationLagSeconds: number;
      performanceSeries: Array<{
        time: string;
        queries: number;
        slowQueries: number;
        connections: number;
      }>;
    };
    api: {
      successRate: number;
      avgResponseMs: number;
      requests: number;
      apiPerformanceSeries: Array<{
        id: string;
        color: string;
        data: Array<{ x: string; y: number }>;
      }>;
      endpointPerformance: Array<{
        endpoint: string;
        avgTimeMs: number;
        successRate: number;
        calls: number;
      }>;
      recentErrors: Array<{
        time: string;
        method: string;
        endpoint: string;
        status: number;
        message: string;
      }>;
    };
  };
};

export type UserManagementOverviewResponse = {
  success: boolean;
  message: string;
  data: {
    userActivity: Array<{ date: string; active: number; newUsers: number }>;
    roleDistribution: Array<{ id: string; label: string; value: number; color: string }>;
    timeline: Array<{
      id: string;
      type: 'login' | 'purchase' | 'account' | 'system' | 'message' | 'warning';
      title: string;
      description?: string;
      timestamp: string;
      user: { name: string; email: string; avatar?: string };
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      type: 'user' | 'system' | 'order' | 'message';
      timestamp: string;
      details?: string;
      ipAddress?: string;
    }>;
    quickStats: {
      totalUsers: number;
      activeToday: number;
      newThisWeek: number;
    };
  };
};

export type SupportTicketItem = {
  id: string;
  name: string;
  email: string;
  userAvatarUrl?: string | null;
  category: 'technical' | 'billing' | 'general' | 'feature-request' | 'bug-report';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    id: string;
    userId: string;
    userName: string;
    userRole: 'admin' | 'user';
    message: string;
    userAvatarUrl?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type SupportTicketsResponse = {
  success: boolean;
  message: string;
  data: {
    items: SupportTicketItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

export type SupportAnalyticsResponse = {
  success: boolean;
  message: string;
  data: {
    totalTickets: number;
    openTickets: number;
    avgResponseTime: string;
    satisfactionRate: number;
    categories: Array<{ id: string; label: string; value: number }>;
    status: Array<{ id: string; label: string; value: number }>;
    responseTimeTrend: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    ticketVolume: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
  };
};

export type SecurityLogsResponse = {
  success: boolean;
  message: string;
  data: {
    generatedAt: string;
    range: { key: DashboardOverviewRange; from: string; to: string };
    summary: {
      totalEvents: number;
      blocked: number;
      risk: { high: number; medium: number; low: number };
    };
    logs: Array<{
      id: string;
      timestamp: string;
      ip: string;
      userAgent: string;
      method: string;
      route: string;
      attackType: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      statusCode: number;
      responseTime: number;
      source: string;
      details: {
        origin?: string;
        query?: Record<string, unknown>;
        body?: unknown;
        responseBody?: unknown;
        message?: string;
      };
    }>;
    alerts: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      status: 'unread' | 'in-progress' | 'resolved';
      severity: 'critical' | 'high' | 'medium' | 'low';
      type: 'suspicious' | 'threat' | 'warning' | 'info';
      source: string;
      affected: string;
    }>;
    metrics: {
      riskCards: { high: number; medium: number; low: number; blocked: number };
      eventsSeries: Array<{ label: string; high: number; medium: number; low: number }>;
      attackTypes: Array<{ id: string; label: string; value: number }>;
    };
  };
};
