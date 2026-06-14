"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMaterialSignedViewUrl,
  materialSignedViewQueryKey,
  MATERIAL_SIGNED_VIEW_STALE_MS,
} from "@/services/api/shared/material-library/material.api";
import {
  ensureFreshSignedMediaUrl,
  logMaterialRenderRecovery,
} from "@/lib/lms/ensure-fresh-signed-media-url";
import { getErrorMessageFromUnknown } from "@/lib/utils/error-message";
import type { ProtectedMediaKind } from "./protected-media-modal";

interface ViewState {
  open: boolean;
  loading: boolean;
  url: string | null;
  title: string;
  subtitle?: string;
  kind: ProtectedMediaKind;
}

const INITIAL: ViewState = {
  open: false,
  loading: false,
  url: null,
  title: "",
  subtitle: undefined,
  kind: "pdf",
};

type OpenMaterialArgs = {
  materialId: string;
  materialType?: "book" | "guide" | "presentation";
  title: string;
  subtitle?: string;
};

/**
 * Opens protected library media with a fresh presigned URL every time (no stale cache).
 */
export function useProtectedMediaViewer() {
  const qc = useQueryClient();
  const [state, setState] = useState<ViewState>(INITIAL);
  const lastMaterialRef = useRef<{
    materialId: string;
    materialType: "book" | "guide" | "presentation";
    title: string;
    subtitle?: string;
  } | null>(null);

  const fetchFreshSignedUrl = useCallback(
    async (materialId: string, materialType: "book" | "guide" | "presentation") => {
      const key = materialSignedViewQueryKey(materialId, materialType);
      await qc.removeQueries({ queryKey: key });
      const fresh = await qc.fetchQuery({
        queryKey: key,
        queryFn: () => fetchMaterialSignedViewUrl(materialId, materialType),
        staleTime: MATERIAL_SIGNED_VIEW_STALE_MS,
        gcTime: 0,
      });
      const raw = fresh?.data?.url?.trim() ?? "";
      const safe = await ensureFreshSignedMediaUrl(
        raw || null,
        async () => {
          await qc.removeQueries({ queryKey: key });
          const again = await qc.fetchQuery({
            queryKey: key,
            queryFn: () => fetchMaterialSignedViewUrl(materialId, materialType),
            staleTime: MATERIAL_SIGNED_VIEW_STALE_MS,
            gcTime: 0,
          });
          return again?.data?.url?.trim() ?? "";
        },
        {
          dedupeKey: `material-protected-view:${materialId}:${materialType}`,
          materialId,
          entityType: "library_material",
        },
      );
      return safe ?? "";
    },
    [qc],
  );

  const openMaterial = useCallback(
    async ({ materialId, materialType, title, subtitle }: OpenMaterialArgs) => {
      const type = materialType ?? "book";
      const kind: ProtectedMediaKind = "pdf";
      lastMaterialRef.current = { materialId, materialType: type, title, subtitle };
      setState((s) => ({ ...s, open: true, loading: true, title, subtitle, kind }));

      try {
        const url = await fetchFreshSignedUrl(materialId, type);
        if (!url) {
          throw new Error("No file URL returned for this material");
        }
        setState((s) => ({ ...s, loading: false, url }));
        logMaterialRenderRecovery({
          reason: "open",
          materialId,
        });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, url: null }));
        toast.error(`Could not open material: ${getErrorMessageFromUnknown(e)}`);
      }
    },
    [fetchFreshSignedUrl],
  );

  /** Re-request a signed URL (e.g. after S3 "Request has expired" in the viewer). */
  const refreshOpenMaterialUrl = useCallback(async () => {
    const last = lastMaterialRef.current;
    if (!last) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const url = await fetchFreshSignedUrl(last.materialId, last.materialType);
      if (!url) throw new Error("No file URL returned");
      setState((s) => ({
        ...s,
        loading: false,
        url,
        title: last.title,
        subtitle: last.subtitle,
      }));
      logMaterialRenderRecovery({
        reason: "refresh",
        materialId: last.materialId,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, url: null }));
      toast.error(`Could not refresh file: ${getErrorMessageFromUnknown(e)}`);
    }
  }, [fetchFreshSignedUrl]);

  const openVideo = useCallback(
    ({ url, title, subtitle }: { url: string; title: string; subtitle?: string }) => {
      lastMaterialRef.current = null;
      setState({
        open: true,
        loading: false,
        url,
        title,
        subtitle,
        kind: "video",
      });
    },
    [],
  );

  const setOpen = useCallback((open: boolean) => {
    setState((s) => (open ? { ...s, open: true } : INITIAL));
    if (!open) lastMaterialRef.current = null;
  }, []);

  return { state, openMaterial, refreshOpenMaterialUrl, openVideo, setOpen };
}
