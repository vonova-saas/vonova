import API from "@/services/axios-client";
import { peelLmsResponseLayers } from "@/lib/api/unwrap-lms-body";
import type {
  ContentReport,
  ModerationResolutionAction,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  ReportsListResponse,
} from "@/types/api/app/community/reports.type";

function unwrap<T>(body: unknown): T {
  return peelLmsResponseLayers(body) as T;
}

export async function submitContentReport(payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  groupId?: string;
}) {
  const res = await API.post("/api/v1/community/reports", payload);
  return unwrap<{ report: ContentReport }>(res.data);
}

export async function adminListReports(params?: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "score";
}): Promise<ReportsListResponse> {
  const res = await API.get("/api/v1/community/admin/reports", { params });
  return unwrap<ReportsListResponse>(res.data);
}

export async function adminGetReport(reportId: string) {
  const res = await API.get(`/api/v1/community/admin/reports/${reportId}`);
  return unwrap<{
    report: ContentReport;
    preview: ContentReport["preview"];
    targetUserId: string | null;
    userHistory: unknown[];
  }>(res.data);
}

export async function adminUpdateReportStatus(
  reportId: string,
  status: ReportStatus,
) {
  const res = await API.patch(
    `/api/v1/community/admin/reports/${reportId}/status`,
    { status },
  );
  return unwrap<ContentReport>(res.data);
}

export async function adminApplyReportAction(
  reportId: string,
  action: ModerationResolutionAction,
  notes?: string,
) {
  const res = await API.patch(
    `/api/v1/community/admin/reports/${reportId}/action`,
    { action, notes },
  );
  return unwrap<unknown>(res.data);
}
