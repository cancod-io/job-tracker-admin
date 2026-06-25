"use client";

import type { ReactNode } from "react";
import { AnalyticsChartViewSelect } from "@/components/admin/analytics/analytics-chart-view-select";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useAnalyticsChartData } from "@/hooks/use-analytics-chart-data";
import type { AnalyticsChartView } from "@/lib/analytics-chart-view";
import type { AnalyticsQueryParams } from "@/types/admin-analytics-api";

type AnalyticsChartTimeseriesSectionProps<T> = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  queryKey: readonly string[];
  fetcher: (token: string, params: AnalyticsQueryParams) => Promise<T>;
  extraParams?: Partial<AnalyticsQueryParams>;
  defaultView?: AnalyticsChartView;
  emptyMessage?: string;
  render: (args: { data: T; view: AnalyticsChartView; loading: boolean }) => ReactNode;
};

export function AnalyticsChartTimeseriesSection<T>({
  title,
  subtitle,
  action,
  className,
  queryKey,
  fetcher,
  extraParams,
  defaultView,
  emptyMessage = "No data for this view.",
  render,
}: AnalyticsChartTimeseriesSectionProps<T>) {
  const { data, loading, error, view, setView } = useAnalyticsChartData(fetcher, {
    queryKey,
    extraParams,
    defaultView,
  });

  return (
    <AnalyticsSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsChartViewSelect value={view} onChange={setView} />
          {action}
        </div>
      }
    >
      {loading && data == null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading chart…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive">{error}</p>
      ) : data == null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        render({ data, view, loading })
      )}
    </AnalyticsSectionCard>
  );
}
