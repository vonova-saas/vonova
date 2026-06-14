import { objectKeyFromStoredValue } from './s3-key.util';

export const STREAM_PIPELINE_ERROR_CODE = 'STREAM_PIPELINE_ERROR' as const;

export type StreamPipelineErrorReason =
  | 'PRESIGN_FAILED'
  | 'INVALID_KEY'
  | 'IAM_ERROR';

export type StreamPipelineErrorBody = {
  code: typeof STREAM_PIPELINE_ERROR_CODE;
  reason: StreamPipelineErrorReason;
};

export function classifyStreamPresignError(err: unknown): StreamPipelineErrorReason {
  const name = (err as { name?: string })?.name ?? '';
  const msg = err instanceof Error ? err.message : String(err);
  if (
    name === 'AccessDenied' ||
    /AccessDenied|403|NotAuthorized|not authorized|Forbidden/i.test(msg)
  ) {
    return 'IAM_ERROR';
  }
  return 'PRESIGN_FAILED';
}

export function streamPipelineErrorPayload(
  reason: StreamPipelineErrorReason,
): StreamPipelineErrorBody {
  return {
    code: STREAM_PIPELINE_ERROR_CODE,
    reason,
  };
}

/**
 * Presign lesson video from stored `videoObjectKey` — never throws; returns streamUrl or structured error.
 */
export async function resolveLessonVideoForApi(
  videoKeyRaw: string,
  presignCanonicalKey: (key: string) => Promise<string>,
): Promise<{
  streamUrl: string | null;
  videoError: boolean;
  error?: StreamPipelineErrorBody;
}> {
  const trimmed = (videoKeyRaw ?? '').trim();
  if (!trimmed) {
    return { streamUrl: null, videoError: false };
  }

  /** Already a playback URL (legacy rows or CDN) — use as-is. */
  if (/^https?:\/\//i.test(trimmed)) {
    return { streamUrl: trimmed, videoError: false };
  }

  const key = objectKeyFromStoredValue(trimmed);
  if (!key) {
    return {
      streamUrl: null,
      videoError: true,
      error: streamPipelineErrorPayload('INVALID_KEY'),
    };
  }

  try {
    const url = await presignCanonicalKey(key);
    const streamUrl = url?.trim() ? url : null;
    if (!streamUrl) {
      return {
        streamUrl: null,
        videoError: true,
        error: streamPipelineErrorPayload('PRESIGN_FAILED'),
      };
    }
    return { streamUrl, videoError: false };
  } catch (e) {
    return {
      streamUrl: null,
      videoError: true,
      error: streamPipelineErrorPayload(classifyStreamPresignError(e)),
    };
  }
}
