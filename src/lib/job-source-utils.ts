/** Humanize API source slugs (e.g. `google_jobs` → `Google Jobs`). */
export function formatJobSourceLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "";
  if (/^[a-z0-9_-]+$/.test(trimmed)) {
    return trimmed
      .split(/[_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}
