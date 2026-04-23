// Types aligned with GET/POST /api/v1/roadmap (api-gateway + LMS roadmap module)

export type RoadmapTextBlock = {
  query: string;
  chapters: Record<string, string[]>;
};

export type RoadmapTreeNode = {
  name: string;
  children?: { name: string; children?: { name: string }[] }[];
};

/** Core roadmap graph returned by generate and get-by-id */
export type RoadmapPayload = {
  status: boolean;
  text: RoadmapTextBlock;
  tree: RoadmapTreeNode[];
  roadmapId: string;
  metadata: {
    generated: string;
    summary: string;
  };
  roadmap_data?: Record<string, unknown>;
};

export type GenerateRoadmapRequest = {
  topic: string;
  skill_level: string;
  duration_weeks: number;
  focus_areas?: string[];
};

export type UpdateRoadmapProgressRequest = {
  week_number?: number;
  milestone_week?: number;
  progress_percentage?: number;
  time_spent_minutes?: number;
  notes?: string;
};

export type UpdateRoadmapProgressResponse = {
  success: boolean;
  message: string;
};

export type DeleteRoadmapResponse = {
  success: boolean;
  message: string;
};

/** Stored roadmap row from GET /roadmap/user-roadmaps (LMS document shape). */
export type UserRoadmapListItem = {
  roadmapId: string;
  title?: string;
  topic?: string;
  overview?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
};

export type UserRoadmapsResponse = {
  success: boolean;
  message: string;
  data: UserRoadmapListItem[];
};

export type RoadmapHealthResponse = {
  success: boolean;
  message: string;
  timestamp: string;
  service: string;
  version: string;
};

export type RoadmapServiceStatsResponse = {
  success: boolean;
  message: string;
  data: {
    total_roadmaps: number;
    total_generations: number;
    active_roadmaps: number;
    average_generation_time: number;
    roadmaps_by_status: Record<string, number>;
  };
};

export type RoadmapAiConnectionResponse = {
  ok: boolean;
  message: string;
  endpoint: string;
};

export type RoadmapSystemStatusResponse = {
  services?: Record<string, string>;
  [key: string]: unknown;
};

export type BulkDeleteRoadmapsRequest = {
  roadmap_ids: string[];
};

export type BulkDeleteRoadmapsResponse = {
  success: boolean;
  message: string;
  data: {
    deleted_count: number;
    failed: string[];
  };
};

export type RoadmapQueryAnalyticsResponse = {
  success: boolean;
  message: string;
  data: {
    total_generations: number;
    popular_topics: Array<{ topic: string; count: number }>;
    skill_level_distribution: Record<string, number>;
    average_duration_weeks: number;
    completion_rate: number;
  };
};

export type RoadmapHistoryEntry = {
  _id?: string;
  roadmapId: string;
  userId: string;
  action: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  week_number?: number;
  milestone_week?: number;
  progress_percentage?: number;
  time_spent_minutes?: number;
  notes?: string;
};

export type RoadmapHistoryResponse = {
  success: boolean;
  message: string;
  data: {
    history: RoadmapHistoryEntry[];
    total: number;
    page: number;
    totalPages: number;
  };
};
