"use client";

import { useEffect, useRef } from "react";
import { syncMediaAuthCookieFromStorage } from "@/lib/media/sync-media-auth-cookie";

/**
 * Copies Bearer token from localStorage to same-origin httpOnly cookie
 * so native media elements can authenticate via /api/v1/media/* proxy.
 * Re-runs when token may have changed (login, refresh).
 */
export function useSyncMediaAuthCookie(): void {
  const synced = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = () => {
      void syncMediaAuthCookieFromStorage().then((ok) => {
        synced.current = ok;
      });
    };

    run();
    const retry = window.setTimeout(run, 1500);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") run();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", run);

    return () => {
      window.clearTimeout(retry);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", run);
    };
  }, []);
}
