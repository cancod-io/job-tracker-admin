import { getPublicApiUrl } from "@/lib/api";

function toWsBase(httpBase: string): string {
  return httpBase.replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
}
export function buildRealtimeWsUrl(accessToken: string): string {
  const token = encodeURIComponent(accessToken);
  const path = `/api/v1/ws?token=${token}`;

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return `wss://${window.location.host}${path}`;
  }

  const wsBase = toWsBase(getPublicApiUrl());
  return `${wsBase}${path}`;
}
