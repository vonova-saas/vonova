export type ReportTargetType =
  | "POST"
  | "COMMENT"
  | "REPOST"
  | "MESSAGE"
  | "USER"
  | "GROUP";

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "misinformation"
  | "impersonation"
  | "nsfw"
  | "copyright"
  | "scam"
  | "illegal-content"
  | "other";

export type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "REJECTED";

export type ModerationResolutionAction =
  | "REMOVE_CONTENT"
  | "WARN_USER"
  | "TEMP_MUTE"
  | "TEMP_BAN"
  | "PERMANENT_BAN"
  | "NO_ACTION";

export type ContentReport = {
  _id: string;
  reporterId: string | { _id: string; name?: string; username?: string };
  targetType: ReportTargetType;
  targetId: string;
  groupId?: string | null;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  autoModScore?: number;
  autoModFlags?: string[];
  resolutionAction?: ModerationResolutionAction | null;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  preview?: {
    text: string;
    removed?: boolean;
    authorId?: string | null;
    groupId?: string | null;
  };
};

export type ReportsListResponse = {
  items: ContentReport[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
