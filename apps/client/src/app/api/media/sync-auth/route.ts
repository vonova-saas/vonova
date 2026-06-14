import { NextRequest, NextResponse } from "next/server";

/**
 * Mirrors API-gateway access token onto the Next.js origin so native
 * <img>/<video>/<iframe> can load same-origin /api/v1/media/* with cookies.
 */
function readToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice("Bearer ".length).trim();
    if (t) return t;
  }
  const fromCookie = req.cookies.get("accessToken")?.value?.trim();
  return fromCookie || null;
}

export async function POST(req: NextRequest) {
  const token = readToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  return res;
}
