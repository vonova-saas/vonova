import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Reject SSRF: only typical AWS S3 host patterns (not Lambda, API Gateway, etc.).
 */
function assertSafeAwsS3PresignedPutUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid upload URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Invalid upload URL (must be https)");
  }
  const host = url.hostname.toLowerCase();
  if (!host.endsWith(".amazonaws.com") && host !== "s3.amazonaws.com") {
    throw new Error(`Invalid upload URL host: ${host}`);
  }
  const looksLikeS3 =
    host.includes(".s3.") ||
    host.startsWith("s3.") ||
    host === "s3.amazonaws.com";
  if (!looksLikeS3) {
    throw new Error(`Invalid upload URL host: ${host}`);
  }
  return url;
}

/**
 * Walk an Error.cause chain (undici wraps a `TypeError: fetch failed` around
 * the real network error) and pull out the most useful diagnostic fields.
 */
function unwrapFetchCause(
  e: unknown,
): { code?: string; syscall?: string; hostname?: string; message?: string } {
  let current: unknown = e;
  for (let i = 0; i < 5 && current; i++) {
    if (current instanceof Error) {
      const c = current as Error & {
        code?: string;
        syscall?: string;
        hostname?: string;
        cause?: unknown;
      };
      if (c.code || c.syscall || c.hostname) {
        return {
          code: c.code,
          syscall: c.syscall,
          hostname: c.hostname,
          message: c.message,
        };
      }
      current = c.cause;
    } else {
      break;
    }
  }
  return {
    message: e instanceof Error ? e.message : String(e),
  };
}

function describeFetchError(e: unknown, fallbackHost: string): string {
  const info = unwrapFetchCause(e);
  const host = info.hostname || fallbackHost;
  const code = info.code;

  switch (code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return `DNS lookup failed for ${host} (${code}). The Next.js server cannot resolve S3 — check internet/VPN/DNS, or set HTTPS_PROXY if behind a corporate proxy.`;
    case "ECONNREFUSED":
      return `Connection refused to ${host} (${code}). A firewall or proxy is blocking outbound HTTPS to S3.`;
    case "ETIMEDOUT":
    case "UND_ERR_CONNECT_TIMEOUT":
      return `Connection to ${host} timed out (${code}). Network/proxy is dropping the request to S3.`;
    case "ECONNRESET":
    case "UND_ERR_SOCKET":
      return `Connection to ${host} was reset (${code}). Often a proxy/AV breaking long uploads, or the presigned URL expired mid-upload.`;
    case "CERT_HAS_EXPIRED":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return `TLS/cert error talking to ${host} (${code}). A proxy/AV is intercepting HTTPS to AWS.`;
    default:
      if (code) {
        return `${info.message ?? "fetch failed"} (${code}${info.syscall ? ` ${info.syscall}` : ""}) host=${host}`;
      }
      return `${info.message ?? "fetch failed"} host=${host}`;
  }
}

/**
 * Forwards a presigned PUT to S3, reading the request body chunk-by-chunk
 * via Web Streams (NOT `request.arrayBuffer()`).
 *
 * Why this shape:
 *   - `request.arrayBuffer()` on the Next.js dev server (especially with
 *     Turbopack) silently caps at ~10 MiB. Course videos are tens to
 *     hundreds of MB. Reading via the underlying ReadableStream avoids
 *     that specific API's cap and lets us *measure* the truncation when
 *     it does happen, instead of blindly forwarding a partial body.
 *   - We forward the body to S3 as a `Blob` with a Content-Length that
 *     matches what we actually read, so undici never raises
 *     `UND_ERR_REQ_CONTENT_LENGTH_MISMATCH`. (Forwarding the client's
 *     declared Content-Length is unsafe: if the dev server truncated the
 *     body we'd be lying to S3.)
 *   - When the bytes we read disagree with the client's declared
 *     Content-Length, we abort with HTTP 413 and a precise message
 *     pointing at the dev-server cap and its workarounds.
 *
 * Memory note: this still buffers the entire body in memory (Web Streams
 * → concatenated Uint8Array). Acceptable for typical course videos
 * (≤ a few hundred MB on a dev box). For multi-GB uploads, the proper
 * answer is direct browser → S3 PUT (set
 * `NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=false` and configure bucket CORS for
 * PUT) — the proxy is a dev convenience, not a scalable transport.
 */
export async function POST(request: NextRequest) {
  const uploadUrl = request.headers.get("x-s3-upload-url");
  const contentType =
    request.headers.get("x-s3-content-type")?.trim() ||
    "application/octet-stream";
  const declaredContentLengthRaw =
    request.headers.get("content-length") ?? "";
  const declaredContentLength = Number.parseInt(declaredContentLengthRaw, 10);
  const haveDeclaredCL =
    Number.isFinite(declaredContentLength) && declaredContentLength > 0;

  if (!uploadUrl?.trim()) {
    return NextResponse.json(
      { error: "Missing x-s3-upload-url header" },
      { status: 400 },
    );
  }

  let url: URL;
  try {
    url = assertSafeAwsS3PresignedPutUrl(uploadUrl);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid URL" },
      { status: 400 },
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { error: "Missing request body stream" },
      { status: 400 },
    );
  }

  // Drain the body via getReader. This bypasses request.arrayBuffer()'s
  // ~10 MiB cap on the dev server, but if the dev server truncates the
  // underlying stream itself (Turbopack does), we'll see fewer bytes than
  // the browser claimed it sent and bail with a clear message below.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        chunks.push(value);
        receivedBytes += value.byteLength;
      }
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to read upload body",
        message: e instanceof Error ? e.message : "Unknown error",
        receivedBytes,
      },
      { status: 400 },
    );
  }

  if (receivedBytes === 0) {
    console.error(
      "[s3-presigned-put-proxy] received 0-byte body from client",
    );
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  // If the browser told us "Content-Length: X" but we read N << X, the
  // dev server (Turbopack) truncated the request body. Refuse instead of
  // silently uploading a partial video.
  if (haveDeclaredCL && receivedBytes < declaredContentLength) {
    console.error(
      `[s3-presigned-put-proxy] body truncated by dev server: read ${receivedBytes}B, browser declared ${declaredContentLength}B`,
    );
    return NextResponse.json(
      {
        error: "Request body truncated by dev server",
        message:
          `The Next.js dev server only delivered ${receivedBytes} of ${declaredContentLength} bytes ` +
          `(short by ${declaredContentLength - receivedBytes}B). Turbopack caps incoming API route bodies at ~10 MiB. ` +
          `Fix: (1) Stop the dev server and run \`npm run dev\` (default — Webpack, no cap), not \`npm run dev:turbo\`. ` +
          `(2) Or set \`NEXT_PUBLIC_USE_S3_UPLOAD_PROXY=false\` and add your dev origin to the LMS S3 bucket CORS so the browser PUTs directly to S3.`,
        receivedBytes,
        declaredBytes: declaredContentLength,
      },
      { status: 413 },
    );
  }

  // Concat into one buffer so undici sets a real Content-Length from
  // blob.size — guaranteed to match what we send.
  const fullBody = new Uint8Array(receivedBytes);
  {
    let offset = 0;
    for (const chunk of chunks) {
      fullBody.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }

  console.log(
    `[s3-presigned-put-proxy] forwarding ${receivedBytes}B (${contentType}) to ${url.hostname}${url.pathname}`,
  );

  try {
    // Wrap in Blob: forces undici to compute a non-chunked Content-Length
    // from blob.size before sending. Raw ArrayBuffer + manual
    // Content-Length has been observed to fall back to chunked transfer,
    // which S3 presigned PUT rejects.
    const s3Body = new Blob([fullBody], { type: contentType });
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: s3Body,
      signal: request.signal,
    });

    if (s3Res.status !== 200 && s3Res.status !== 204) {
      const detail = (await s3Res.text().catch(() => "")).slice(0, 800);
      console.error(
        `[s3-presigned-put-proxy] S3 rejected upload status=${s3Res.status} sent=${receivedBytes}B detail=${detail.slice(0, 200)}`,
      );
      return NextResponse.json(
        {
          error: "S3 rejected upload",
          status: s3Res.status,
          sentBytes: receivedBytes,
          detail,
        },
        { status: 502 },
      );
    }

    const etag = s3Res.headers.get("etag") ?? "";
    console.log(
      `[s3-presigned-put-proxy] S3 accepted upload status=${s3Res.status} etag=${etag} sent=${receivedBytes}B`,
    );

    return NextResponse.json(
      { ok: true, sentBytes: receivedBytes, etag },
      { status: 200 },
    );
  } catch (e) {
    console.error(
      `[s3-presigned-put-proxy] forward to S3 failed after ${receivedBytes}B:`,
      e,
    );
    return NextResponse.json(
      {
        error: "Proxy upload failed",
        message: describeFetchError(e, url.hostname),
        sentBytes: receivedBytes,
      },
      { status: 502 },
    );
  }
}
