/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['example.com', 'git-scm.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  // async rewrites() {
  //   const gateway = process.env.API_GATEWAY_URL;
  //   if (!gateway) {
  //     // No gateway configured; don’t set rewrites to avoid build-time errors in certain setups
  //     return [];
  //   }
  //   return [
  //     // Auth lives at the gateway root as /auth/*; keep frontend at /api/v1/auth/*
  //     {
  //       source: '/api/v1/auth/:path*',
  //       destination: `${gateway}/auth/:path*`,
  //     },
  //     // General API proxy for other services under /api/* (e.g., /api/v1/...)
  //     {
  //       source: '/api/v1/:path*',
  //       destination: `${gateway}/api/v1/:path*`,
  //     },
  //   ];
  // },
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  //         { key: 'X-Content-Type-Options', value: 'nosniff' },
  //         { key: 'X-Frame-Options', value: 'DENY' },
  //         { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  //         { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig