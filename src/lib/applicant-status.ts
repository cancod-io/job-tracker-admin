/**
 * Presentation helpers for application lifecycle statuses returned by the admin
 * applicants endpoint: applied, interviewing, offer, failed, rejected.
 */
import type { ApplicantStatus } from "@/types/admin-job-api";

export const APPLICANT_STATUSES: readonly ApplicantStatus[] = [
  "applied",
  "interviewing",
  "offer",
  "failed",
  "rejected",
] as const;

const STATUS_SET: ReadonlySet<string> = new Set(APPLICANT_STATUSES);

export function isApplicantStatus(value: unknown): value is ApplicantStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

/** "applied" → "Applied"; "in_progress" → "In progress". */
export function formatApplicantStatus(status: string): string {
  const text = status.replace(/_/g, " ").trim();
  if (!text) return "—";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Tailwind classes for a status pill, color-coded per lifecycle stage. */
export function applicantBadgeClass(status: string): string {
  switch (status) {
    case "applied":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "interviewing":
      return "border-blue-500/30 bg-blue-500/15 text-blue-800 dark:text-blue-200";
    case "offer":
      return "border-violet-500/30 bg-violet-500/15 text-violet-800 dark:text-violet-200";
    case "failed":
      return "border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200";
    case "rejected":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Deterministic avatar tint from a name, for applicant initials chips. */
export function avatarTint(seed: string): string {
  const palette: readonly [string, ...string[]] = [
    "bg-sky-500/20 text-sky-700 dark:text-sky-200",
    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
    "bg-violet-500/20 text-violet-700 dark:text-violet-200",
    "bg-amber-500/20 text-amber-700 dark:text-amber-200",
    "bg-rose-500/20 text-rose-700 dark:text-rose-200",
    "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length] ?? palette[0];
}

/** "John Doe" → "JD"; "alice" → "AL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}
