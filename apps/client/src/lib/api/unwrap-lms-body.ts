/**
 * Peels repeated `{ data: … }` wrappers from gateway / BFF responses.
 * Some stacks nest `{ data: { data: payload } }`; a single `unwrapLmsData` misses `chapters`.
 */
export function peelLmsResponseLayers(body: unknown, maxDepth = 12): unknown {
  let cur: unknown = body;
  for (let i = 0; i < maxDepth; i++) {
    if (
      cur &&
      typeof cur === "object" &&
      "data" in cur &&
      (cur as { data: unknown }).data !== undefined &&
      (cur as { data: unknown }).data !== null
    ) {
      cur = (cur as { data: unknown }).data;
      continue;
    }
    break;
  }
  return cur;
}

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

/** Peels nested `{ data: … }` envelopes until stable (gateway + LMS). */
export function unwrapLmsDataDeep<T>(body: unknown): T {
  return peelLmsResponseLayers(body) as T;
}

export function unwrapLmsEnvelope<T extends Record<string, unknown>>(
  body: unknown,
): T {
  return (body && typeof body === "object" ? body : {}) as T;
}
