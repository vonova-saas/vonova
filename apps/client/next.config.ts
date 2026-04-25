/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
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
    ],
  },
};

export default nextConfig