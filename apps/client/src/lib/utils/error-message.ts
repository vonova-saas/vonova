/**
 * Best-effort message from axios errors, Rpc-style bodies, or standard Error.
 */
export function getErrorMessageFromUnknown(error: unknown): string {
  if (error == null) return "Unknown error";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const e = error as Record<string, unknown>;

    const response = e.response;
    if (response && typeof response === "object") {
      const data = (response as { data?: unknown }).data;
      if (data && typeof data === "object") {
        const msg = (data as { message?: unknown }).message;
        if (typeof msg === "string" && msg.trim()) return msg.trim();
      }
    }

    if (typeof e.message === "string" && e.message.trim()) {
      return e.message.trim();
    }
  }

  return "Unknown error";
}
