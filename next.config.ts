import type { NextConfig } from "next";

/** Server-side upstream for rewrites (browser never calls this URL when using the proxy). */
function upstreamApiOrigin(): string {
  const raw =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Dynamic redirects and breadcrumb paths are easier without strict route typing. */
  typedRoutes: false,
  async rewrites() {
    const base = upstreamApiOrigin();
    return [
      {
        source: "/upstream-api/:path*",
        destination: `${base}/api/v1/:path*`,
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
