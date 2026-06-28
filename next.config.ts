import type { NextConfig } from "next";

/** Server-side upstream for the TrackCod API (used by rewrites + Route Handlers). */
function upstreamApiOrigin(): string {
  const raw =
    process.env.API_INTERNAL_URL ?? "http://147.93.180.179:8000";
  return raw.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  async rewrites() {
    const base = upstreamApiOrigin();
    return [
      {
        source: "/upstream-api/:path*",
        destination: `${base}/api/v1/:path*`,
      },
      {
        source: "/upstream-admin-api/:path*",
        destination: `${base}/api/admin/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
