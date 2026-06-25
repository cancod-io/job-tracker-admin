/** Shared date helpers for admin filters and display. */

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parts = key.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function isDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function formatDateKey(key: string): string {
  const d = parseDateKey(key);
  return d ? formatDate(d.toISOString()) : key;
}

export function formatDateRange(from: string, to: string): string {
  if (!from && !to) return "Posted date";
  if (from && !to) return `From ${formatDateKey(from)}`;
  if (!from && to) return `Until ${formatDateKey(to)}`;
  if (from === to) return formatDateKey(from);
  return `${formatDateKey(from)} – ${formatDateKey(to)}`;
}

export function dateKeyToPostedFromUtc(key: string): string {
  return `${key}T00:00:00Z`;
}

export function dateKeyToPostedToUtc(key: string): string {
  return `${key}T23:59:59Z`;
}

/** Exclusive end of analytics period [from, to) — midnight UTC on the day after `key`. */
export function dateKeyToAnalyticsToExclusiveUtc(key: string): string {
  const d = parseDateKey(key);
  if (!d) return `${key}T23:59:59Z`;
  d.setDate(d.getDate() + 1);
  return `${toDateKey(d)}T00:00:00Z`;
}
