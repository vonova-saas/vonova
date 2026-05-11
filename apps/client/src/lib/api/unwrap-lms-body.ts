/**
 * Normalize LMS HTTP responses: some endpoints return `{ message, data }`,
 * others return the entity directly (e.g. presigned course from gateway).
 */
export function unwrapLmsData<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    (body as { data: unknown }).data !== undefined &&
    (body as { data: unknown }).data !== null
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function unwrapLmsEnvelope<T extends Record<string, unknown>>(
  body: unknown,
): T {
  return (body && typeof body === "object" ? body : {}) as T;
}
