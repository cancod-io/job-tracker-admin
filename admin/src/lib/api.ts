/**
 * Browser-visible API base (no trailing slash).
 * Must be reachable from the machine running the browser (e.g. `http://localhost:8000`).
 * Avoid Docker-only hostnames like `http://backend:8000` here — that breaks client-side fetch.
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getPublicApiUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  console.log(`${base}${p}`);

  return `${base}${p}`;
}
