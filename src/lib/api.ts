/**
 * Browser: same-origin proxy paths are rewritten by Next.js to the real API (see `next.config.ts`),
 * avoiding cross-origin CORS preflight (`OPTIONS`) failures when the admin UI and API are on different hosts.
 *
 * Server (SSR/RSC): uses `NEXT_PUBLIC_API_URL` (or default) directly — no CORS on the server.
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/** Backend base for server-side Route Handlers (Docker-friendly via API_INTERNAL_URL). */
export function getInternalApiBase(): string {
  const raw =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

/**
 * @param path API path including `/api/v1/...`, `/api/admin/...`, and optional `?query`
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const q = normalized.indexOf("?");
  const pathOnly = q === -1 ? normalized : normalized.slice(0, q);
  const search = q === -1 ? "" : normalized.slice(q);

  if (typeof window === "undefined") {
    return `${getPublicApiUrl()}${normalized}`;
  }

  // Proxied by Next.js Route Handlers under src/app/api/admin/applications/.
  if (pathOnly.startsWith("/api/admin/applications/")) {
    return normalized;
  }

  if (pathOnly.startsWith("/api/v1/")) {
    const afterV1 = pathOnly.slice("/api/v1/".length);
    if (afterV1.length === 0) {
      return `/upstream-api${search}`;
    }
    return `/upstream-api/${afterV1}${search}`;
  }

  if (pathOnly.startsWith("/api/admin/")) {
    const afterAdmin = pathOnly.slice("/api/admin/".length);
    if (afterAdmin.length === 0) {
      return `/upstream-admin-api${search}`;
    }
    return `/upstream-admin-api/${afterAdmin}${search}`;
  }

  return `${getPublicApiUrl()}${normalized}`;
}
