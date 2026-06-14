/** Dev/staging guard: fail fast if a presigned GET URL reaches rendering code. */
export function assertLegalMediaUrl(
  url: string | null | undefined,
  context?: string,
): void {
  const s = (url ?? "").trim();
  if (!s) return;
  if (
    s.includes("X-Amz-Algorithm") ||
    s.includes("X-Amz-Expires") ||
    s.includes("AWSAccessKeyId")
  ) {
    const msg = `[ILLEGAL_PRESIGNED_GET_URL]${context ? ` context=${context}` : ""}`;
    console.error(msg, s.slice(0, 120));
    throw new Error(msg);
  }
  if (process.env.NODE_ENV === "production") return;
  if (!/X-Amz-|AWSAccessKeyId|Signature=/i.test(s)) return;
  const msg = `[ILLEGAL_PRESIGNED_GET_URL]${context ? ` context=${context}` : ""} url=${s.slice(0, 120)}…`;
  console.error(msg);
  throw new Error(msg);
}
