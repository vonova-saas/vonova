import { NextRequest, NextResponse } from "next/server";
import { resolveGatewayMediaBaseUrl } from "@/lib/media/gateway-media-base";

async function proxyMedia(req: NextRequest, pathSegments: string[]) {
  const base = resolveGatewayMediaBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: "API gateway URL not configured" },
      { status: 502 },
    );
  }

  const subPath = pathSegments.map(encodeURIComponent).join("/");
  const target = `${base}/api/v1/media/${subPath}${req.nextUrl.search}`;

  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const range = req.headers.get("range");
  if (range) headers.set("range", range);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  const outHeaders = new Headers();
  const pass = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
    "cache-control",
  ] as const;
  for (const name of pass) {
    const v = upstream.headers.get(name);
    if (v) outHeaders.set(name, v);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxyMedia(req, path);
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxyMedia(req, path);
}
