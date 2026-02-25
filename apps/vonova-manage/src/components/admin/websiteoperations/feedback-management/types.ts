export type FeedbackType = 'bug' | 'feature' | 'suggestion' | 'other';

export interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  contactEmail?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'rejected';
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  metadata: {
    userAgent?: string;
    url?: string;
    timestamp: string;
  };
}

export interface FeedbackFilters {
  type?: FeedbackType | 'all';
  status?: 'all' | 'new' | 'in_progress' | 'resolved' | 'rejected';
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  search?: string;
}

export interface FeedbackStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  byType: Record<FeedbackType, number>;
  byDate: Array<{ date: string; count: number }>;
}
