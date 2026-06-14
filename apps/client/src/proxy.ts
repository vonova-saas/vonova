import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isLocalhost = hostname.includes("localhost");

  // Skip Next.js internals and static files
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.startsWith("/robots.txt") ||
    url.pathname.startsWith("/sitemap.xml") ||
    url.pathname.startsWith("/fonts") ||
    url.pathname.startsWith("/icons") ||
    url.pathname.startsWith("/images") ||
    url.pathname.startsWith("/avatars") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/community")
  ) {
    return NextResponse.next();
  }

  // 🚫 Block access to certain routes until logic is ready
  // Block in production only
  if (!isLocalhost) {
    // 🚫 Block admin. subdomains in production
  }

  const isStudentSubdomain = url.pathname.startsWith("/student");

  const isInstructorSubdomain = url.pathname.startsWith("/instructor");

  if (isStudentSubdomain) {
    if (!url.pathname.startsWith("/student")) {
      url.pathname = `/student${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else if (isInstructorSubdomain) {
    if (!url.pathname.startsWith("/instructor")) {
      url.pathname = `/instructor${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // ✅ Default site (marketing, e-shop, auth, user dashboards)
    if (!url.pathname.startsWith("/site")) {
      url.pathname = `/site${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
