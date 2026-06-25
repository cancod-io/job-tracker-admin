import { getPublicApiUrl } from "@/lib/api";

/** WebSocket URL for the realtime endpoint (same host as REST API). */
export function buildRealtimeWsUrl(accessToken: string): string {
  const httpBase = getPublicApiUrl();
  const wsBase = httpBase.replace(/^http/i, (scheme) =>
    scheme.toLowerCase() === "https" ? "wss" : "ws",
  );
  return `${wsBase}/api/v1/ws?token=${encodeURIComponent(accessToken)}`;
}
