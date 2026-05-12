/**
 * Browser: same-origin `/upstream-api/...` is rewritten by Next.js to the real API (see `next.config.ts`),
 * avoiding cross-origin CORS preflight (`OPTIONS`) failures when the admin UI and API are on different hosts.
 *
 * Server (SSR/RSC): uses `NEXT_PUBLIC_API_URL` (or default) directly — no CORS on the server.
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/**
 * @param path API path including `/api/v1/...` and optional `?query`
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const q = normalized.indexOf("?");
  const pathOnly = q === -1 ? normalized : normalized.slice(0, q);
  const search = q === -1 ? "" : normalized.slice(q);

  if (typeof window === "undefined") {
    return `${getPublicApiUrl()}${normalized}`;
  }

  if (!pathOnly.startsWith("/api/v1/")) {
    return `${getPublicApiUrl()}${normalized}`;
  }

  const afterV1 = pathOnly.slice("/api/v1/".length);
  if (afterV1.length === 0) {
    return `/upstream-api${search}`;
  }
  return `/upstream-api/${afterV1}${search}`;
}
