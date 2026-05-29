import type { NextConfig } from "next";

/** Server-side upstream for the main FastAPI backend. */
function upstreamApiOrigin(): string {
  const raw =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/**
 * Server-side upstream for the standalone Job Scraper service.
 * Falls back to `NEXT_PUBLIC_SCRAPER_API_URL`, then `http://localhost:3002`.
 */
function upstreamScraperOrigin(): string {
  const raw =
    process.env.SCRAPER_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_SCRAPER_API_URL ??
    "http://localhost:3002";
  return raw.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Dynamic redirects and breadcrumb paths are easier without strict route typing. */
  typedRoutes: false,
  async rewrites() {
    const base = upstreamApiOrigin();
    const scraperBase = upstreamScraperOrigin();
    return [
      /**
       * Main FastAPI backend (versioned routes):
       * /upstream-api/<path> → <base>/api/v1/<path>
       */
      {
        source: "/upstream-api/:path*",
        destination: `${base}/api/v1/:path*`,
      },
      /**
       * Main FastAPI backend (unversioned admin routes, e.g. companies):
       * /upstream-admin-api/<path> → <base>/api/admin/<path>
       */
      {
        source: "/upstream-admin-api/:path*",
        destination: `${base}/api/admin/:path*`,
      },
      /**
       * Scraper service:
       * /upstream-scraper/<path> → <scraperBase>/api/jobs/<path>
       *
       * The browser-side `scraperUrl()` helper strips `/api/jobs` and
       * prepends `/upstream-scraper` so rewrites land here correctly.
       */
      {
        source: "/upstream-scraper/:path*",
        destination: `${scraperBase}/api/jobs/:path*`,
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
