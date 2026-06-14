export type MediaMetricEvent =
  | 'lesson_upload_success'
  | 'lesson_upload_failure'
  | 'material_upload_success'
  | 'material_upload_failure'
  | 'material_open_failure'
  | 'thumbnail_presign_failure'
  | 'video_recovery_success'
  | 'video_recovery_failure';

const totals: Partial<Record<MediaMetricEvent, number>> = {};

export function bumpMediaMetric(
  event: MediaMetricEvent,
  meta?: Record<string, unknown>,
): void {
  totals[event] = (totals[event] ?? 0) + 1;
  // eslint-disable-next-line no-console
  console.log(
    '[MEDIA_METRIC]',
    JSON.stringify({
      event,
      total: totals[event],
      ...meta,
    }),
  );
}

export function getMediaMetricTotalsSnapshot(): Record<string, number> {
  return { ...totals } as Record<string, number>;
}
