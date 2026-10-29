/** @type {import('next').NextConfig} */
const rawBackendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api";
const normalizedBackendUrl = rawBackendUrl.trim().replace(/\/$/, "");
const backendApiUrl = normalizedBackendUrl.endsWith("/api")
  ? normalizedBackendUrl
  : `${normalizedBackendUrl}/api`;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
