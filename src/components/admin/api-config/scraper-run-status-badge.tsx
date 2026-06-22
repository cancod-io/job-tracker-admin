"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  idle: "border-border bg-muted/50 text-muted-foreground",
  queued: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  running: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
};

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  queued: "Queued",
  running: "Running",
  success: "Success",
  failed: "Failed",
  cancelled: "Cancelled",
};

type ScraperRunStatusBadgeProps = {
  status: string;
  className?: string;
};

export function ScraperRunStatusBadge({ status, className }: ScraperRunStatusBadgeProps) {
  const normalized = status.toLowerCase();
  const label = STATUS_LABELS[normalized] ?? status;
  const style = STATUS_STYLES[normalized] ?? STATUS_STYLES.idle;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className,
      )}
    >
      {normalized === "running" ? (
        <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
      ) : null}
      {label}
    </span>
  );
}
