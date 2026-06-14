type ParsedUsageLimitError = {
  isUsageLimit: boolean;
  title: string;
  description: string;
};

function readAxiosPayload(error: unknown): {
  status?: number;
  code?: string;
  message?: string;
  data?: Record<string, unknown>;
} {
  const res = (error as { response?: { status?: number; data?: Record<string, unknown> } })
    ?.response;
  const payload = res?.data;
  if (!payload || typeof payload !== "object") {
    return { status: res?.status };
  }
  const nested = payload.error as Record<string, unknown> | undefined;
  const code = String(payload.code ?? nested?.code ?? "").toUpperCase();
  const message =
    (typeof payload.message === "string" ? payload.message : undefined) ??
    (typeof nested?.message === "string" ? nested.message : undefined) ??
    "";
  const inner =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : undefined;
  return {
    status: res?.status,
    code,
    message,
    data: inner,
  };
}

/**
 * Maps API/limit errors to user-facing copy focused on monthly AI credits.
 * Handles legacy daily-limit codes from the LMS gateway as generic limits.
 */
export function parseUsageLimitError(error: unknown): ParsedUsageLimitError {
  const { status, code, message, data } = readAxiosPayload(error);

  if (status === 409 || code === "CREDITS_EXHAUSTED" || code === "USAGE_LIMIT") {
    return {
      isUsageLimit: true,
      title: "Not enough AI credits",
      description:
        "You do not have enough AI credits left this month for this action. " +
        "Upgrade your plan or wait until your monthly credits reset on the 1st (UTC).",
    };
  }

  if (
    status === 429 ||
    code === "AI_DAILY_LIMIT_EXCEEDED" ||
    code === "DAILY_LIMIT_EXCEEDED"
  ) {
    const feature =
      typeof data?.feature === "string"
        ? data.feature.replace(/_/g, " ")
        : "this AI feature";
    return {
      isUsageLimit: true,
      title: "AI usage limit reached",
      description:
        `We could not complete ${feature} right now because an AI usage limit applies. ` +
        "Check your monthly AI credits on the dashboard or try again later.",
    };
  }

  return {
    isUsageLimit: false,
    title: "Something went wrong",
    description:
      message || "Unexpected error. Please try again.",
  };
}

/** Stable log line for `unknown` rejects (Axios/CustomError often print as `{}`). */
export function describeUnknownErrorForLog(error: unknown): string {
  if (error === undefined || error === null) {
    return "unknown error (no details)";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  const { status, message } = readAxiosPayload(error);
  const e = error as {
    errorCode?: string;
    code?: string;
    message?: string;
  };
  const code = e.errorCode || e.code || "";
  const net = typeof e.message === "string" ? e.message : "";
  const parts = [
    code,
    status != null ? `HTTP ${status}` : "",
    message || net,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
