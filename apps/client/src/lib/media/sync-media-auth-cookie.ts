/** Copy Bearer token from localStorage to same-origin httpOnly cookie for media proxy. */
export async function syncMediaAuthCookieFromStorage(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("accessToken")?.trim();
  if (!token) return false;

  const res = await fetch("/api/media/sync-auth", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  return res.ok;
}
