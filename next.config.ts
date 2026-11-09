import type { NextConfig } from "next";

/**
 * Prefer runtime Route Handlers (`/upstream-api`, `/upstream-admin-api`) over
 * build-time rewrites so Docker `API_INTERNAL_URL` can change without rebuild.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Smaller Docker image; faster cold start on VPS.
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "chart.js", "react-chartjs-2"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
  webpack: (config, { isServer }) => {
    // @vladmandic/face-api uses dynamic require(); warn only, don't fail the graph.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@vladmandic[\\/]face-api/,
        message: /Critical dependency: require function is used/,
      },
    ];
    // Browser-only / heavy Node libs — keep them out of the server graph.
    if (isServer) {
      config.externals = config.externals ?? [];
      if (Array.isArray(config.externals)) {
        config.externals.push("@vladmandic/face-api", "mammoth", "bluebird");
      }
    }
    return config;
  },
};

export default nextConfig;
