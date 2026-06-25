import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatAnalyticsPercent } from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

export type AnalyticsKpiTrend = {
  pct: number | null;
  label?: string;
};

type AnalyticsKpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  trend?: AnalyticsKpiTrend;
  /** When true, an increase shows red and a decrease shows green (e.g. pending approvals). */
  invertTrend?: boolean;
};

export function AnalyticsKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName = "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  trend,
  invertTrend = false,
}: AnalyticsKpiCardProps) {
  const trendUp = trend?.pct != null && trend.pct > 0;
  const trendDown = trend?.pct != null && trend.pct < 0;
  const trendFlat = trend?.pct != null && trend.pct === 0;

  const positive = invertTrend ? trendDown : trendUp;
  const negative = invertTrend ? trendUp : trendDown;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
              iconClassName,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          {trend?.pct != null ? (
            <p
              className={cn(
                "mt-1 inline-flex flex-wrap items-center gap-1 text-xs font-medium",
                positive && "text-emerald-600 dark:text-emerald-400",
                negative && "text-rose-600 dark:text-rose-400",
                trendFlat && "text-muted-foreground",
              )}
            >
              {trendUp ? (
                <ArrowUpRight className="size-3.5" aria-hidden />
              ) : trendDown ? (
                <ArrowDownRight className="size-3.5" aria-hidden />
              ) : (
                <Minus className="size-3.5" aria-hidden />
              )}
              {formatAnalyticsPercent(Math.abs(trend.pct), false)}
              {trend.label ? (
                <span className="font-normal text-muted-foreground">{trend.label}</span>
              ) : null}
            </p>
          ) : hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type AnalyticsKpiGridProps = {
  children: React.ReactNode;
};

export function AnalyticsKpiGrid({ children }: AnalyticsKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {children}
    </div>
  );
}
