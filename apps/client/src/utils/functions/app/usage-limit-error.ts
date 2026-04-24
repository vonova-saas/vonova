type UsageLimitDetails = {
  feature?: string;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
  unit?: 'count' | 'minutes' | string;
};

type ParsedUsageLimitError = {
  isUsageLimit: boolean;
  title: string;
  description: string;
};

const FEATURE_LABELS: Record<string, string> = {
  ai_roadmap: 'AI roadmap generation',
  pdf_summary: 'PDF upload',
  pdf_voice: 'PDF voice chat',
};

export function parseUsageLimitError(error: unknown): ParsedUsageLimitError {
  const response = (
    error as { response?: { data?: Record<string, unknown> } }
  )?.response;
  const payload = response?.data;
  const nestedError = payload?.error as Record<string, unknown> | undefined;
  const code = payload?.code ?? nestedError?.code;
  const payloadMessage =
    typeof payload?.message === 'string' ? payload.message : undefined;
  const nestedMessage =
    typeof nestedError?.message === 'string' ? nestedError.message : undefined;

  if (code !== 'DAILY_LIMIT_EXCEEDED') {
    return {
      isUsageLimit: false,
      title: 'Something went wrong',
      description:
        payloadMessage ??
        nestedMessage ??
        'Unexpected error. Please try again.',
    };
  }

  const details = (payload?.details ?? nestedError?.details ?? {}) as UsageLimitDetails;
  const featureLabel = FEATURE_LABELS[String(details.feature ?? '')] ?? 'this feature';
  const used = typeof details.used === 'number' ? details.used : undefined;
  const limit = typeof details.limit === 'number' ? details.limit : null;
  const remaining =
    typeof details.remaining === 'number' ? details.remaining : undefined;
  const unit = details.unit === 'minutes' ? 'minutes' : 'requests';

  const usagePart =
    used !== undefined && limit !== null
      ? `You used ${used}/${limit} ${unit} today.`
      : "You've reached today's limit.";
  const remainingPart =
    remaining !== undefined ? ` Remaining today: ${remaining}.` : '';

  return {
    isUsageLimit: true,
    title: `${featureLabel} daily limit reached`,
    description: `${usagePart}${remainingPart} Limits reset automatically at 00:00 UTC. You can try again tomorrow or upgrade your plan.`,
  };
}
