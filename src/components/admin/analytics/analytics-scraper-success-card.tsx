"use client";

import { AnalyticsScraperProviderRateChart } from "@/components/admin/analytics/charts/analytics-scraper-provider-rate-chart";
import { AnalyticsTimeseriesMeta } from "@/components/admin/analytics/analytics-timeseries-meta";
import {
  buildScrapingProviderRateSeries,
  formatAnalyticsPercent,
} from "@/lib/analytics-utils";
import type { AnalyticsChartView } from "@/lib/analytics-chart-view";
import {
  formatScraperProviderLabel,
  formatScraperRunDuration,
  isHiddenScraperProvider,
} from "@/lib/scraper-provider-utils";
import type {
  AnalyticsScrapingSummary,
  AnalyticsScrapingTimeseries,
} from "@/types/admin-analytics-api";
import { cn } from "@/lib/utils";

const PROVIDER_BAR_COLORS = ["#10B981", "#14B8A6", "#0EA5E9", "#8B5CF6"] as const;

type AnalyticsScraperSuccessCardProps = {
  summary: AnalyticsScrapingSummary | null;
  timeseries?: AnalyticsScrapingTimeseries | null;
  view?: AnalyticsChartView;
  fallbackRate?: number | null;
};

function successRatePercent(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return formatAnalyticsPercent(rate, true);
}

function providerBarColor(index: number): string {
  return PROVIDER_BAR_COLORS[index % PROVIDER_BAR_COLORS.length] ?? "#10B981";
}

export function AnalyticsScraperSuccessCard({
  summary,
  timeseries = null,
  view,
  fallbackRate = null,
}: AnalyticsScraperSuccessCardProps) {
  const providerSeries = buildScrapingProviderRateSeries(timeseries);
  const providers = (summary?.by_provider ?? timeseries?.by_provider ?? []).filter(
    (provider) => !isHiddenScraperProvider(provider.provider, provider.label),
  );
  const overallRate = summary?.success_rate ?? fallbackRate;
  const chartPointCount = providerSeries[0]?.points.length ?? 0;
  const chartGranularity = timeseries?.granularity ?? "day";

  if (!summary && !timeseries && fallbackRate == null) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No scraper success data for this range.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {providerSeries.length > 0 ? (
        <div className="space-y-2">
          <AnalyticsTimeseriesMeta
            view={view}
            granularity={chartGranularity}
            pointCount={chartPointCount}
          />
          <AnalyticsScraperProviderRateChart series={providerSeries} />
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center rounded-xl border border-border/60 bg-emerald-500/5">
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {successRatePercent(overallRate)}
            </p>
            {summary?.total_runs ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.total_runs} runs
                {summary.avg_duration_ms != null
                  ? ` · avg ${formatScraperRunDuration(summary.avg_duration_ms)}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {providers.length > 0 && providerSeries.length === 0 ? (
        <ul className="space-y-3">
          {providers.map((provider, index) => {
            const rate = provider.success_rate;
            const width =
              rate == null ? 0 : Math.max(0, Math.min(100, rate * 100));
            const color = providerBarColor(index);

            return (
              <li key={provider.provider}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-foreground">
                    {provider.label || formatScraperProviderLabel(provider.provider)}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-foreground">
                    {successRatePercent(provider.success_rate)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={cn("h-full rounded-full transition-all")}
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {provider.total_runs} runs
                  {provider.success_count > 0 || provider.failed_count > 0
                    ? ` · ${provider.success_count} ok`
                    : ""}
                  {provider.failed_count > 0 ? ` · ${provider.failed_count} failed` : ""}
                  {provider.cancelled_count > 0 ? ` · ${provider.cancelled_count} cancelled` : ""}
                  {provider.avg_duration_ms != null
                    ? ` · ${formatScraperRunDuration(provider.avg_duration_ms)} avg`
                    : ""}
                </p>
              </li>
            );
          })}
        </ul>
      ) : providerSeries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No per-provider breakdown for this range.
        </p>
      ) : null}
    </div>
  );
}
