"use client";

import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";

const OPTIONS = [
  { value: "none", label: "No comparison" },
  { value: "previous_period", label: "Previous period" },
] as const;

type AnalyticsCompareSelectProps = {
  compact?: boolean;
};

export function AnalyticsCompareSelect({ compact = false }: AnalyticsCompareSelectProps) {
  const { compareMode, setCompareMode } = useAnalyticsFilters();

  if (compact) {
    return (
      <label className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground">
        <span className="text-muted-foreground">Compare:</span>
        <select
          value={compareMode}
          onChange={(e) =>
            setCompareMode(e.target.value === "previous_period" ? "previous_period" : "none")
          }
          className="bg-transparent text-sm font-medium outline-none"
          aria-label="Compare to previous period"
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === "previous_period" ? "Previous period" : option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="flex min-w-[12rem] flex-col justify-center rounded-2xl border border-border/80 bg-card/60 p-3 shadow-sm">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Compare
      </label>
      <select
        value={compareMode}
        onChange={(e) =>
          setCompareMode(e.target.value === "previous_period" ? "previous_period" : "none")
        }
        className="mt-1 rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
        aria-label="Compare to previous period"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
