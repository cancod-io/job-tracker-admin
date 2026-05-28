/**
 * Domain helpers for the `JobAtsStatus` ATS pipeline — kept close to the type
 * so any view (jobs list, dashboards, future analytics) can reuse them without
 * cross-component imports.
 */
import type { JobAtsStatus } from "@/types/job-api";

/** Ordered pipeline states (excludes the terminal `rejected` / `archived`). */
export const PIPELINE_STATUSES: readonly Exclude<JobAtsStatus, "rejected" | "archived">[] = [
  "new",
  "shortlisted",
  "applied",
  "interviewing",
  "offer",
] as const;

/** Statuses the user can move a job into manually (excludes `archived`). */
export const TRACKABLE_STATUSES: readonly Exclude<JobAtsStatus, "archived">[] = [
  "new",
  "shortlisted",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

const STATUS_SET: ReadonlySet<JobAtsStatus> = new Set([
  "new",
  "shortlisted",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "archived",
]);

export function isJobAtsStatus(value: unknown): value is JobAtsStatus {
  return typeof value === "string" && STATUS_SET.has(value as JobAtsStatus);
}

export function normalizeAtsStatus(value: unknown): JobAtsStatus {
  return isJobAtsStatus(value) ? value : "new";
}

/** "applied" → "applied"; "in_progress" → "in progress". */
export function formatAtsStatus(status: JobAtsStatus): string {
  return status.replace(/_/g, " ");
}

/** Tailwind classes for a pill / badge styled per status. */
export function atsBadgeClass(status: JobAtsStatus): string {
  switch (status) {
    case "new":
      return "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30";
    case "shortlisted":
      return "bg-violet-500/15 text-violet-900 dark:text-violet-100 border-violet-500/30";
    case "applied":
      return "bg-blue-500/15 text-blue-900 dark:text-blue-100 border-blue-500/30";
    case "interviewing":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30";
    case "offer":
      return "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 border-emerald-500/30";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/25";
    case "archived":
      return "bg-muted text-muted-foreground border-border";
  }
}

/** 0–100 progress percentage for the pipeline bar. */
export function statusProgress(status: JobAtsStatus): number {
  if (status === "rejected" || status === "archived") return 100;
  const index = PIPELINE_STATUSES.indexOf(status);
  if (index <= 0) return 8;
  return Math.round((index / (PIPELINE_STATUSES.length - 1)) * 100);
}
