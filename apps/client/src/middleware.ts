import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  // const isLocalhost = hostname.includes("localhost");

  // Skip Next.js internals and static files
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.startsWith("/robots.txt") ||
    url.pathname.startsWith("/sitemap.xml") ||
    url.pathname.startsWith("/fonts") ||
    url.pathname.startsWith("/icons") ||
    url.pathname.startsWith("/images") ||
    url.pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // 🚫 Block access to certain routes until logic is ready
  // Block in production only
  // if (!isLocalhost) {
  //   const forbiddenPaths = ["/auth"];
  //   if (forbiddenPaths.some(path => url.pathname.startsWith(path))) {
  //     url.pathname = "/site/forbidden"; // 👈 Redirect
  //     return NextResponse.rewrite(url);
  //   }

  //   // 🚫 Block admin. and instructor. subdomains in production
  //   if (hostname.startsWith("admin.") || hostname.startsWith("instructor.")) {
  //     url.pathname = "/site/forbidden";
  //     return NextResponse.rewrite(url);
  //   }
  // }

  // ✅ Admin subdomain
  const isAdminSubdomain =
    hostname.startsWith("admin.") ||
    (hostname === "localhost:3000" && url.pathname.startsWith("/admin"));

  const isStudentSubdomain =
    hostname.startsWith("student.") ||
    (hostname === "localhost:3000" && url.pathname.startsWith("/student"));

  const isInstructorSubdomain =
    hostname.startsWith("instructor.") ||
    (hostname === "localhost:3000" && url.pathname.startsWith("/instructor"));

  if (isAdminSubdomain) {
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else if (isStudentSubdomain) {
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
