/** Locale-aware datetime / duration formatting helpers shared across admin views. */

const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const SHORT_DATE_TIME = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "medium",
});

const TIME_MEDIUM = new Intl.DateTimeFormat(undefined, { timeStyle: "medium" });
const TIME_SHORT = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

/** "Nov 28, 2025, 3:41 PM" — returns "—" for null and the raw string for unparseable input. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return DATE_TIME.format(d);
}

/** "11/28/25, 3:41:09 PM" — used for high-density log tables. */
export function formatShortDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return SHORT_DATE_TIME.format(date);
}

/** "3:41:09 PM" — for "last checked" indicators. */
export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return TIME_MEDIUM.format(date);
}

/** "3:41 PM" — for compact card headers. */
export function formatShortTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return TIME_SHORT.format(date);
}

/**
 * Human-readable elapsed duration: "42s", "12m 7s", "3h 18m".
 * Designed for service-uptime displays where readability beats precision.
 */
export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
