import {
  getLessonVideoPresignedPutMutationFn,
  confirmLessonVideoUploadMutationFn,
} from "@/services/instructor/course-managment/courses.api";

/** Lesson uploads: extension whitelist (must match S3 CORS + presigned Content-Type story). */
export const ALLOWED_LESSON_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"] as const;

export function isAllowedLessonVideoFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (ALLOWED_LESSON_VIDEO_EXTENSIONS as readonly string[]).includes(
    ext,
  );
}

export function assertAllowedLessonVideoFile(file: File): void {
  if (!isAllowedLessonVideoFile(file)) {
    throw new Error(
      "Only MP4, MOV, and WebM files are allowed for lesson video uploads.",
    );
  }
}

/**
 * Same normalization as LMS presign PUT — header must match signed Content-Type exactly.
 * When the browser leaves `file.type` empty, infer from extension so the PUT matches the URL.
 */
export function videoMimeForPresignedPut(file: File): string {
  const raw = file.type?.trim() ?? "";
  if (raw && raw.toLowerCase().startsWith("video/")) {
    const i = raw.indexOf("/");
    if (i < 0) return "video/mp4";
    const type = raw.slice(0, i).toLowerCase();
    const sub = raw.slice(i + 1).toLowerCase();
    return `${type}/${sub || "mp4"}`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  if (ext === "mp4") return "video/mp4";
  return "video/mp4";
}

/**
 * Browser → S3 PUT is often blocked without bucket CORS (xhr status 0 / "network error").
 * Same-origin proxy forwards to S3 from the Next.js server (no browser CORS to AWS).
 *
 * - `NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=true` — always proxy
 * - `NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=false` — always direct PUT
 * - unset — proxy on localhost / loopback / common LAN dev IPs, direct elsewhere
 *
 * Optional: `NEXT_PUBLIC_TRY_UPLOAD_PROXY_ON_DIRECT_FAIL=true` — if direct PUT fails
 * (e.g. CORS), retry once through the same-origin proxy (needs large-body dev server; see .env.example).
 */
export function shouldUseS3UploadProxy(): boolean {
  if (typeof window === "undefined") return false;
  const flag = process.env.NEXT_PUBLIC_USE_S3_UPLOAD_PROXY;
  if (flag === "false") return false;
  if (flag === "true") return true;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function tryUploadProxyAfterDirectFail(): boolean {
  return process.env.NEXT_PUBLIC_TRY_UPLOAD_PROXY_ON_DIRECT_FAIL === "true";
}

const UPLOAD_MAX_RETRIES = 3;

function isRetryableUploadError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const m = err.message;
  if (/Video upload proxy failed \(413\)/.test(m)) return false;
  if (/Request body truncated|truncated by dev server/i.test(m)) return false;
  if (/sentBytes=\d+ but the file is/i.test(m)) return false;
  if (/empty ETag|0-byte/i.test(m)) return false;
  if (/Only MP4, MOV, and WebM/i.test(m)) return false;
  if (/S3 upload failed \(4(00|03)\)/.test(m)) return false;
  if (/Content-Type matches the presigned/i.test(m)) return false;
  if (/browser blocked|missing S3 CORS/i.test(m)) return false;
  return true;
}

async function withUploadRetries(fn: () => Promise<void>): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < UPLOAD_MAX_RETRIES; attempt++) {
    try {
      await fn();
      return;
    } catch (e) {
      last = e;
      if (attempt === UPLOAD_MAX_RETRIES - 1) break;
      if (!isRetryableUploadError(e)) break;
      const delayMs = Math.min(8000, 500 * 2 ** attempt);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last;
}

function uploadUrlForLog(uploadUrl: string): string {
  try {
    const u = new URL(uploadUrl);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "(invalid-url)";
  }
}

function logS3VideoUploadError(
  context: string,
  info: Record<string, unknown>,
): void {
  console.error("[S3 VIDEO UPLOAD ERROR]", { context, ...info });
}

function parseProxyErrorResponse(xhr: XMLHttpRequest): string {
  try {
    const j = JSON.parse(xhr.responseText) as {
      error?: string;
      detail?: string;
      message?: string;
      status?: number;
    };
    const parts = [j.error, j.message, j.detail].filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
    if (parts.length) return parts.join(" — ");
  } catch {
    /* response wasn't JSON — fall through to raw text */
  }
  return xhr.responseText?.slice(0, 300) || `HTTP ${xhr.status}`;
}

function parseProxySuccessResponse(
  xhr: XMLHttpRequest,
): { sentBytes?: number; etag?: string } {
  try {
    const j = JSON.parse(xhr.responseText) as {
      ok?: boolean;
      sentBytes?: number;
      etag?: string;
    };
    return { sentBytes: j.sentBytes, etag: j.etag };
  } catch {
    return {};
  }
}

/** POST file to Next.js; server forwards PUT to S3 (avoids browser CORS). */
function xhrPostFileToPresignedPutProxy(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (file.size === 0) {
      reject(
        new Error(
          "Selected video file is 0 bytes. Re-pick the file and try again.",
        ),
      );
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/lms/s3-presigned-put-proxy");
    xhr.setRequestHeader("x-s3-upload-url", uploadUrl);
    xhr.setRequestHeader("x-s3-content-type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 204) {
        onProgress?.(100);
        resolve();
        return;
      }
      if (xhr.status === 200) {
        const { sentBytes, etag } = parseProxySuccessResponse(xhr);
        if (typeof sentBytes === "number" && sentBytes < file.size * 0.5) {
          logS3VideoUploadError("proxy:onload:truncated", {
            status: xhr.status,
            response: xhr.responseText?.slice(0, 500),
            uploadUrl: uploadUrlForLog(uploadUrl),
            sentBytes,
            fileSize: file.size,
          });
          reject(
            new Error(
              `Upload proxy reported sentBytes=${sentBytes} but the file is ${file.size} bytes — the request body was truncated. Re-pick the file and try again, or set NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=false to PUT to S3 directly (configure bucket CORS).`,
            ),
          );
          return;
        }
        const etagOk =
          typeof etag === "string" &&
          etag.replace(/"/g, "").trim().length > 0;
        const sizeOk =
          typeof sentBytes === "number" && sentBytes >= file.size * 0.99;
        if (!etagOk && !sizeOk) {
          logS3VideoUploadError("proxy:onload:bad-etag", {
            status: xhr.status,
            response: xhr.responseText?.slice(0, 500),
            uploadUrl: uploadUrlForLog(uploadUrl),
            sentBytes,
            etag,
            fileSize: file.size,
          });
          reject(
            new Error(
              "S3 returned an empty or weak ETag — upload may be incomplete. Re-pick the file and try again.",
            ),
          );
          return;
        }
        onProgress?.(100);
        resolve();
        return;
      }
      logS3VideoUploadError("proxy:onload:http-error", {
        status: xhr.status,
        response: xhr.responseText?.slice(0, 500),
        uploadUrl: uploadUrlForLog(uploadUrl),
      });
      reject(
        new Error(
          `Video upload proxy failed (${xhr.status}): ${parseProxyErrorResponse(xhr)}`,
        ),
      );
    };
    xhr.onerror = () => {
      logS3VideoUploadError("proxy:onerror", {
        status: xhr.status,
        response: xhr.responseText?.slice(0, 500),
        uploadUrl: uploadUrlForLog(uploadUrl),
      });
      reject(
        new Error(
          "Upload proxy network error (is the Next.js dev server reachable?)",
        ),
      );
    };
    xhr.send(file);
  });
}

export function xhrPutToPresignedUrl(
  uploadUrl: string,
  body: Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (body.size === 0) {
      reject(
        new Error(
          "Selected video file is 0 bytes. Re-pick the file and try again.",
        ),
      );
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        resolve();
      } else {
        logS3VideoUploadError("direct:onload:http-error", {
          status: xhr.status,
          response: xhr.responseText?.slice(0, 500),
          uploadUrl: uploadUrlForLog(uploadUrl),
        });
        reject(
          new Error(
            `S3 upload failed (${xhr.status}). Check bucket policy, CORS, and that Content-Type matches the presigned request.`,
          ),
        );
      }
    };
    xhr.onerror = () => {
      logS3VideoUploadError("direct:onerror", {
        status: xhr.status,
        response: xhr.responseText?.slice(0, 500),
        uploadUrl: uploadUrlForLog(uploadUrl),
      });
      reject(
        new Error(
          "S3 upload network error (browser blocked the request — usually missing S3 CORS for PUT from this origin). Set NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=true to use the same-origin proxy, add your app origin to the LMS bucket CORS AllowedOrigins, or set NEXT_PUBLIC_TRY_UPLOAD_PROXY_ON_DIRECT_FAIL=true to retry via proxy after a direct failure.",
        ),
      );
    };
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(body);
  });
}

async function putFileToS3Presigned(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const runProxy = () =>
    withUploadRetries(() =>
      xhrPostFileToPresignedPutProxy(
        uploadUrl,
        file,
        contentType,
        onProgress,
      ),
    );

  const runDirect = () =>
    withUploadRetries(() =>
      xhrPutToPresignedUrl(uploadUrl, file, contentType, onProgress),
    );

  if (shouldUseS3UploadProxy()) {
    await runProxy();
    return;
  }

  if (!tryUploadProxyAfterDirectFail()) {
    await runDirect();
    return;
  }

  try {
    await runDirect();
  } catch (directErr) {
    console.warn(
      "[S3 VIDEO UPLOAD] direct PUT failed; retrying via same-origin proxy (NEXT_PUBLIC_TRY_UPLOAD_PROXY_ON_DIRECT_FAIL=true)",
      directErr,
    );
    await runProxy();
  }
}

export type LessonVideoUploadPhase = "presign" | "put" | "confirm";

/** Presign PUT → upload (direct or via same-origin proxy) → LMS confirm. */
export async function uploadLessonVideoViaPresignedPut(
  courseId: string,
  chapterId: string,
  lessonId: string,
  file: File,
  onProgress?: (percent: number) => void,
  onPhase?: (phase: LessonVideoUploadPhase) => void,
): Promise<string> {
  assertAllowedLessonVideoFile(file);

  const videoMime = videoMimeForPresignedPut(file);
  onPhase?.("presign");
  const { uploadUrl, objectKey } = await getLessonVideoPresignedPutMutationFn(
    courseId,
    chapterId,
    lessonId,
    { fileName: file.name, contentType: videoMime },
  );
  onPhase?.("put");
  await putFileToS3Presigned(uploadUrl, file, videoMime, onProgress);
  onPhase?.("confirm");
  await confirmLessonVideoUploadMutationFn(
    courseId,
    chapterId,
    lessonId,
    objectKey,
    file.size,
  );
  return objectKey;
}
