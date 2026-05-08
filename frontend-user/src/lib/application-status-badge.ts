import type { ApplicationStatus } from "@/types/job";

/**
 * Pill styles for job/application status — tuned for WCAG-friendly contrast in light & dark mode.
 */
export function applicationStatusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "Applied":
      return [
        "bg-sky-100 text-sky-950 ring-1 ring-sky-400/50",
        "dark:bg-sky-950/90 dark:text-sky-50 dark:ring-sky-400/45",
      ].join(" ");
    case "Pending":
      return [
        "bg-amber-100 text-amber-950 ring-1 ring-amber-400/55",
        "dark:bg-amber-950/95 dark:text-amber-50 dark:ring-amber-500/40",
      ].join(" ");
    case "Interview Scheduled":
      return [
        "bg-teal-100 text-teal-950 ring-1 ring-teal-400/50",
        "dark:bg-teal-950/95 dark:text-teal-50 dark:ring-teal-400/45",
      ].join(" ");
    case "Not Applied":
      return [
        "bg-slate-100 text-slate-800 ring-1 ring-slate-300/90",
        "dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500/45",
      ].join(" ");
  }
}
