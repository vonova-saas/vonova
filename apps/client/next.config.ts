/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  /** Next.js 16 buffers API bodies when `proxy.ts` exists; default cap is 10MB. */
  experimental: {
    proxyClientMaxBodySize: '5gb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },

      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },

      {
        protocol: 'https',
        hostname: 'vonova-app.s3.eu-north-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'vonova-lms.s3.eu-north-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
  },
};

export default nextConfig