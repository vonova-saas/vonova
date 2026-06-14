import { syncMediaAuthCookieFromStorage } from "@/lib/media/sync-media-auth-cookie";

/** Persist JWT from login/refresh so same-origin media routes can authenticate. */
export function persistAccessTokenFromAuthResponse(data: unknown): void {
  if (typeof window === "undefined" || data == null || typeof data !== "object") {
    return;
  }
  const root = data as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const token =
    (typeof root.accessToken === "string" ? root.accessToken : null) ??
    (nested && typeof nested.accessToken === "string"
      ? nested.accessToken
      : null);
  const trimmed = token?.trim();
  if (!trimmed) return;
  localStorage.setItem("accessToken", trimmed);
  void syncMediaAuthCookieFromStorage();
}

export function clearPersistedAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
}
