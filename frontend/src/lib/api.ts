/**
 * Browser-visible API base (no trailing slash).
 * Must be reachable from the user's browser (e.g. `http://localhost:8000`).
 */
export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getPublicApiUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
