"use client";

import { useAnalyticsHealthQuery } from "@/hooks/use-analytics-queries";
import type { AnalyticsHealthStatus } from "@/types/admin-analytics-api";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AnalyticsHealthStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
};

export function AnalyticsHealthBar() {
  const healthQuery = useAnalyticsHealthQuery({
    enabled: true,
  });

  const subsystems = healthQuery.data?.subsystems ?? [];

  if (subsystems.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        System health
      </p>
      {subsystems.map((item) => (
        <div
          key={item.key}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs"
          title={item.message ?? undefined}
        >
          <span className={cn("size-2 rounded-full", STATUS_STYLES[item.status])} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
