import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const AVATAR_KEY_PREFIX = "avatars/";
const MAX_AVATAR_BYTES = 15 * 1024 * 1024;

/** Virtual-hosted S3 URLs only (e.g. bucket.s3.region.amazonaws.com). Mitigates open-proxy abuse. */
function isAllowedS3AvatarHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h.endsWith(".amazonaws.com") && h.includes(".s3.");
}

function parseVirtualHostedS3(
  hostname: string,
  pathname: string,
): { bucket: string; region: string; key: string } | null {
  const match = hostname.match(/^(.+)\.s3\.([a-z0-9-]+)\.amazonaws\.com$/i);
  if (!match) return null;
  const rawPath = pathname.replace(/^\/+/, "");
  if (!rawPath) return null;
  let key: string;
  try {
    key = decodeURIComponent(rawPath);
  } catch {
    key = rawPath;
  }
  return { bucket: match[1], region: match[2], key };
}

function s3AppEnv() {
  const region = process.env.AWS_S3_REGION_APP?.trim();
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP?.trim();
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP?.trim();
  const bucket = process.env.AWS_S3_BUCKET_APP?.trim();
  if (!region || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { region, accessKeyId, secretAccessKey, bucket };
}

async function fetchObjectViaS3Sdk(
  bucket: string,
  key: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const env = s3AppEnv();
  if (!env || bucket !== env.bucket) return null;
  if (!key.startsWith(AVATAR_KEY_PREFIX)) return null;

  const client = new S3Client({
    region: env.region,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });

  try {
    const out = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = out.Body;
    if (!body) return null;
    const bytes = await body.transformToByteArray();
    if (bytes.byteLength > MAX_AVATAR_BYTES) return null;
    const contentType =
      out.ContentType?.split(";")[0]?.trim() || "application/octet-stream";
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "Only https is allowed" }, { status: 400 });
  }

  if (!isAllowedS3AvatarHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const parsed = parseVirtualHostedS3(target.hostname, target.pathname);
  const env = s3AppEnv();

  if (parsed && env && parsed.bucket === env.bucket) {
    if (parsed.region.toLowerCase() !== env.region.toLowerCase()) {
      return new NextResponse(null, { status: 403 });
    }
    const viaSdk = await fetchObjectViaS3Sdk(parsed.bucket, parsed.key);
    if (viaSdk) {
      return new NextResponse(Buffer.from(viaSdk.bytes), {
        status: 200,
        headers: {
          "Content-Type": viaSdk.contentType,
          "Cache-Control": "private, max-age=300",
        },
      });
    }
    return new NextResponse(null, { status: 404 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { Accept: "image/*,*/*;q=0.8" },
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const buf = await upstream.arrayBuffer();
  const ct =
    upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=300",
    },
  });
}
