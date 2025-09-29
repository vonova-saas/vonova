import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isLocalhost = hostname.includes("localhost");

  // Only enforce canonical domain in production to keep previews/local usable
  // const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  // if (!isProd) return NextResponse.next();

  // const configuredSite = process.env.NEXT_PUBLIC_APP_DOMAIN || 'vonova.tech';
  // const primaryHost = configuredSite.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // const host = request.headers.get('host') || '';

  // // Redirect all traffic from *.vercel.app or www.<primary> to the primary domain
  // if (host.endsWith('.vercel.app') || host === `www.${primaryHost}`) {
  //   const url = request.nextUrl.clone();
  //   url.host = primaryHost;
  //   url.protocol = 'https';
  //   return NextResponse.redirect(url, 308);
  // }

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
  if (!isLocalhost) {
    // 🚫 Block admin. subdomains in production
    if (hostname.startsWith("admin.")) {
      url.pathname = "/site/forbidden";
      return NextResponse.rewrite(url);
    }
  }

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

// export const config = {
//   matcher: [
//     // Run on all paths except static assets
//     '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
//   ],
// };
