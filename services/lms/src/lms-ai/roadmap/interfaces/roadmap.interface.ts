export interface IWeek {
  week: number;
  title: string;
  objectives: string[];
  topics: string[];
  resources: string[];
  projects: string[];
  estimated_hours: number;
}

export interface IMilestone {
  week: number;
  milestone: string;
  deliverable: string;
}

export interface ITreeNode {
  name: string;
  children?: ITreeNode[];
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  BEGINNER_CAP = 'Beginner',
  INTERMEDIATE_CAP = 'Intermediate',
  ADVANCED_CAP = 'Advanced',
}

export const SKILL_LEVEL_VALUES: SkillLevel[] = [
  SkillLevel.BEGINNER,
  SkillLevel.INTERMEDIATE,
  SkillLevel.ADVANCED,
  SkillLevel.BEGINNER_CAP,
  SkillLevel.INTERMEDIATE_CAP,
  SkillLevel.ADVANCED_CAP,
];

export interface IRoadmapRequest {
  topic: string;
  skill_level: SkillLevel;
  duration_weeks: number;
  focus_areas?: string[];
  userId: string;
}

export interface IRoadmapData {
  roadmapId: string;
  title: string;
  overview: string;
  prerequisites: string[];
  weeks: IWeek[];
  milestones: IMilestone[];
  final_project: string;
  next_steps: string[];
  topic: string;
  skill_level: SkillLevel;
  duration_weeks: number;
  focus_areas?: string[];
  userId: string;
  created_at: Date;
  updated_at: Date;
  ai_model_used: string;
  generation_time_ms?: number;
  total_estimated_hours?: number;
  status: 'generated' | 'in_progress' | 'completed' | 'archived';
}

export interface IRoadmapResponse {
  status: boolean;
  text: {
    query: string;
    chapters: Record<string, string[]>;
  };
  tree: ITreeNode[];
  roadmapId: string;
  metadata: {
    generated: string;
    summary: string;
  };
  roadmap_data: IRoadmapData;
}

export interface IRoadmapHistory {
  _id?: string;
  roadmapId: string;
  userId: string;
  action:
    | 'generated'
    | 'viewed'
    | 'started'
    | 'week_completed'
    | 'milestone_reached'
    | 'completed'
    | 'archived';
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  week_number?: number;
  milestone_week?: number;
  progress_percentage?: number;
  time_spent_minutes?: number;
  notes?: string;
}
