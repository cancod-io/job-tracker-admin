"use client";

import { ANALYTICS_CHART_VIEW_OPTIONS, type AnalyticsChartView } from "@/lib/analytics-chart-view";
import { cn } from "@/lib/utils";

type AnalyticsChartViewSelectProps = {
  value: AnalyticsChartView;
  onChange: (view: AnalyticsChartView) => void;
  className?: string;
};

export function AnalyticsChartViewSelect({
  value,
  onChange,
  className,
}: AnalyticsChartViewSelectProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2 py-1.5",
        className,
      )}
      role="group"
      aria-label="Chart time view"
    >
      <span className="pl-1 text-xs text-muted-foreground">View:</span>
      <div className="inline-flex rounded-md bg-muted/40 p-0.5">
        {ANALYTICS_CHART_VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-xs",
              value === option.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
