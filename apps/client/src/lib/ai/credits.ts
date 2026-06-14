import type {
  AiSubscriptionPlan,
  AiUsageFeature,
} from "@/types/api/app/community/social.types";

/**
 * Per-action credit cost. Authoritative deductions live in
 * `services/app/src/Community/social/social-hub.service.ts` — keep in sync.
 */
export const FEATURE_COST: Record<AiUsageFeature, number> = {
  PDF_CHAT: 2,
  PDF_SUMMARY: 60,
  QUIZ_GENERATION: 35,
  ARTICLE_GENERATION: 40,
  MINDMAP_GENERATION: 35,
};

export const MONTHLY_ALLOWANCE: Record<AiSubscriptionPlan, number> = {
  FREE: 300,
  PRO: 5000,
};

/** UI labels for credit pricing tables (not necessarily API enum names). */
export const FEATURE_LABELS: Record<AiUsageFeature, string> = {
  PDF_CHAT: "PDF Chat",
  PDF_SUMMARY: "PDF Summary",
  QUIZ_GENERATION: "Quiz Generation",
  ARTICLE_GENERATION: "Article Generation",
  MINDMAP_GENERATION: "Roadmap",
};

export const FEATURE_COST_ROWS: Array<{
  feature: AiUsageFeature;
  label: string;
  cost: number;
}> = (
  Object.keys(FEATURE_COST) as AiUsageFeature[]
).map((feature) => ({
  feature,
  label: FEATURE_LABELS[feature],
  cost: FEATURE_COST[feature],
}));

export function getMonthlyCreditAllowance(plan: AiSubscriptionPlan): number {
  return MONTHLY_ALLOWANCE[plan] ?? MONTHLY_ALLOWANCE.FREE;
}

export function getFeatureCost(feature: string): number {
  if (feature in FEATURE_COST) {
    return FEATURE_COST[feature as AiUsageFeature];
  }
  return 1;
}

/** First moment of the next calendar month (UTC). */
export function getNextUtcMonthStart(from = new Date()): Date {
  return new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
}

export function formatUtcMonthlyResetShort(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
