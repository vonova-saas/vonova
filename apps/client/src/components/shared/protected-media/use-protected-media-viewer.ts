"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchMaterialSignedViewUrl,
  materialSignedViewQueryKey,
  MATERIAL_SIGNED_VIEW_STALE_MS,
} from "@/services/api/shared/material-library/material.api";
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

/**
 * Shared opener for any presigned material. Caches signed URLs in React Query
 * (so a re-open within the staleTime is instant) and surfaces a single
 * `state` object plus `setOpen` for the modal.
 */
export function useProtectedMediaViewer() {
  const qc = useQueryClient();
  const [state, setState] = useState<ViewState>(INITIAL);

  const openMaterial = useCallback(
    async ({
      materialId,
      materialType,
      title,
      subtitle,
    }: {
      materialId: string;
      materialType?: "book" | "guide" | "presentation";
      title: string;
      subtitle?: string;
    }) => {
      const type = materialType ?? "book";
      const kind: ProtectedMediaKind = "pdf";
      setState((s) => ({ ...s, open: true, loading: true, title, subtitle, kind }));

      try {
        const cached = qc.getQueryData<{ success: boolean; data: { url: string } }>(
          materialSignedViewQueryKey(materialId, type),
        );
        let url: string | undefined = cached?.data?.url;

        if (!url) {
          const fresh = await qc.fetchQuery({
            queryKey: materialSignedViewQueryKey(materialId, type),
            queryFn: () => fetchMaterialSignedViewUrl(materialId, type),
            staleTime: MATERIAL_SIGNED_VIEW_STALE_MS,
          });
          url = fresh?.data?.url;
        }

        if (!url) {
          throw new Error("No file URL returned for this material");
        }

        setState((s) => ({ ...s, loading: false, url: url ?? null }));
      } catch (e) {
        setState((s) => ({ ...s, loading: false, url: null }));
        toast.error(`Could not open material: ${getErrorMessageFromUnknown(e)}`);
      }
    },
    [qc],
  );

  const openVideo = useCallback(
    ({ url, title, subtitle }: { url: string; title: string; subtitle?: string }) => {
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
  }, []);

  return { state, openMaterial, openVideo, setOpen };
}
