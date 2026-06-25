"use client";

import { AnalyticsApplicationsOverTimeChart } from "@/components/admin/analytics/analytics-applications-over-time-chart";
import { AnalyticsChartTimeseriesSection } from "@/components/admin/analytics/analytics-chart-timeseries-section";
import { AnalyticsDonutChart } from "@/components/admin/analytics/charts/analytics-donut-chart";
import { AnalyticsFunnelChart } from "@/components/admin/analytics/analytics-funnel-chart";
import { AnalyticsExportButton } from "@/components/admin/analytics/analytics-export-button";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import { exportAnalyticsFunnel, getAnalyticsApplicationsTimeseries } from "@/lib/admin-analytics-api";
import {
  useAnalyticsApplicationsBySourceQuery,
  useAnalyticsApplicationsFunnelQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import { formatAnalyticsNumber, aggregateDonutSlices } from "@/lib/analytics-utils";
import { useAuth } from "@/providers/auth-provider";

export function AnalyticsApplicationsPanel() {
  const { accessToken } = useAuth();
  const { apiParams, triggerRefresh } = useAnalyticsFilters();

  const funnelQuery = useAnalyticsApplicationsFunnelQuery(apiParams);
  const bySourceQuery = useAnalyticsApplicationsBySourceQuery(apiParams);

  const funnel = funnelQuery.data;
  const bySource = bySourceQuery.data ?? [];

  const loading = funnelQuery.isLoading;
  const refreshing = funnelQuery.isFetching || bySourceQuery.isFetching;
  const error = queryErrorMessage(funnelQuery.error) ?? queryErrorMessage(bySourceQuery.error);

  const sourceTotal = bySource.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Applications Analytics"
        subtitle="Pipeline funnel, volume trends, and applications grouped by job source."
        onRefresh={triggerRefresh}
        refreshing={refreshing}
        actions={
          accessToken ? (
            <AnalyticsExportButton
              onExport={() => exportAnalyticsFunnel(accessToken, apiParams)}
            />
          ) : undefined
        }
      />
      <AnalyticsPageState
        loading={loading}
        error={error}
        empty={!funnel || (funnel.total === 0 && funnel.stages.every((s) => s.count === 0))}
      >
        {funnel ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsSectionCard
                title="Application Funnel"
                subtitle={`${funnel.total} applications in range`}
              >
                <AnalyticsFunnelChart stages={funnel.stages} total={funnel.total} layout="wide" />
              </AnalyticsSectionCard>
              <AnalyticsChartTimeseriesSection
                title="Applications Over Time"
                queryKey={["applications", "timeseries"]}
                fetcher={(token, params) => getAnalyticsApplicationsTimeseries(token, params)}
                emptyMessage="No application trend data for this view."
                render={({ data, view }) => (
                  <AnalyticsApplicationsOverTimeChart timeseries={data} view={view} />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsSectionCard title="Applications by Source">
                <AnalyticsDonutChart
                  slices={aggregateDonutSlices(
                    bySource.map((r) => ({ id: r.key, label: r.label, value: r.count })),
                  )}
                  centerValue={sourceTotal}
                />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard title="Source Breakdown">
                {bySource.length > 0 ? (
                  <ul className="space-y-2">
                    {bySource.map((row) => (
                      <li key={row.key} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{row.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatAnalyticsNumber(row.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No applications yet for the selected range.
                  </p>
                )}
              </AnalyticsSectionCard>
            </div>
          </div>
        ) : null}
      </AnalyticsPageState>
    </div>
  );
}
