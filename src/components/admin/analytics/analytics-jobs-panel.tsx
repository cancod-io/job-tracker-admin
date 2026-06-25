"use client";

import { useMemo } from "react";
import { AnalyticsDonutChart } from "@/components/admin/analytics/charts/analytics-donut-chart";
import { AnalyticsLineChart } from "@/components/admin/analytics/charts/analytics-line-chart";
import { AnalyticsStackedBarChart } from "@/components/admin/analytics/charts/analytics-stacked-bar-chart";
import { AnalyticsChartTimeseriesSection } from "@/components/admin/analytics/analytics-chart-timeseries-section";
import { AnalyticsTimeseriesMeta } from "@/components/admin/analytics/analytics-timeseries-meta";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import {
  getAnalyticsFetchRunsTimeseries,
  getAnalyticsJobsTimeseries,
} from "@/lib/admin-analytics-api";
import {
  useAnalyticsFetchRunsSummaryQuery,
  useAnalyticsJobsBreakdownQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import {
  formatAnalyticsNumber,
  buildJobTypeDonutSlices,
  buildNewVsOldDonutSlices,
  buildSourceDonutSlices,
} from "@/lib/analytics-utils";
import type { AnalyticsFetchRunsTimeseries, AnalyticsTimeseries } from "@/types/admin-analytics-api";
import { formatDateTime } from "@/lib/format-date";

function buildFetchRunsStackedPoints(fetchTs: AnalyticsFetchRunsTimeseries | null) {
  if (!fetchTs?.series.length) return [];
  const byDate = new Map<
    string,
    { added: number; updated: number; unchanged: number; removed: number }
  >();
  for (const series of fetchTs.series) {
    for (const point of series.points) {
      const existing = byDate.get(point.date) ?? {
        added: 0,
        updated: 0,
        unchanged: 0,
        removed: 0,
      };
      byDate.set(point.date, {
        added: existing.added + point.added,
        updated: existing.updated + point.updated,
        unchanged: existing.unchanged + point.unchanged,
        removed: existing.removed + point.removed,
      });
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));
}

export function AnalyticsJobsPanel() {
  const { apiParams, triggerRefresh } = useAnalyticsFilters();

  const breakdownQuery = useAnalyticsJobsBreakdownQuery({ ...apiParams, limit: 10 });
  const fetchSummaryQuery = useAnalyticsFetchRunsSummaryQuery(apiParams);

  const breakdown = breakdownQuery.data;
  const fetchSummary = fetchSummaryQuery.data ?? null;

  const loading = breakdownQuery.isLoading;
  const refreshing = breakdownQuery.isFetching || fetchSummaryQuery.isFetching;
  const error =
    queryErrorMessage(breakdownQuery.error) ?? queryErrorMessage(fetchSummaryQuery.error);

  const sourceDonut = useMemo(
    () => buildSourceDonutSlices(breakdown?.by_source ?? []),
    [breakdown],
  );

  const newVsOld = useMemo(
    () => buildNewVsOldDonutSlices(breakdown?.by_is_new ?? []),
    [breakdown],
  );

  const jobTypeDonut = useMemo(
    () => buildJobTypeDonutSlices(breakdown?.by_job_type ?? []),
    [breakdown],
  );

  const jobsTotal = breakdown?.by_source.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Jobs Analytics"
        subtitle="Inventory breakdown, creation trends, and fetch-run diff movement."
        onRefresh={triggerRefresh}
        refreshing={refreshing}
      />
      <AnalyticsPageState loading={loading} error={error} empty={!breakdown}>
        {breakdown ? (
          <div className="space-y-4">
            <AnalyticsChartTimeseriesSection
              title="Jobs Over Time"
              queryKey={["jobs", "timeseries"]}
              fetcher={(token, params) => getAnalyticsJobsTimeseries(token, params)}
              emptyMessage="No jobs trend data for this view."
              render={({ data, view }) => {
                const points =
                  (data as AnalyticsTimeseries).series[0]?.points.map((point) => ({
                    date: point.date,
                    value: point.count,
                  })) ?? [];
                if (points.length === 0) {
                  return (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No jobs trend data for this view.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    <AnalyticsTimeseriesMeta
                      view={view}
                      granularity={(data as AnalyticsTimeseries).granularity}
                      pointCount={points.length}
                    />
                    <AnalyticsLineChart points={points} label="Jobs created" />
                  </div>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <AnalyticsSectionCard title="Jobs by Source">
                <AnalyticsDonutChart slices={sourceDonut} centerValue={jobsTotal} />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard title="New vs Old Jobs">
                <AnalyticsDonutChart slices={newVsOld} centerValue={jobsTotal} />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard title="Jobs by Type">
                <AnalyticsDonutChart slices={jobTypeDonut} centerValue={jobsTotal} />
              </AnalyticsSectionCard>
            </div>

            <AnalyticsChartTimeseriesSection
              title="Diff Movement (Fetch Runs)"
              queryKey={["fetch-runs", "timeseries"]}
              fetcher={(token, params) => getAnalyticsFetchRunsTimeseries(token, params)}
              emptyMessage="No fetch-run diff data for this view."
              render={({ data, view }) => {
                const stackedPoints = buildFetchRunsStackedPoints(data);
                if (stackedPoints.length === 0) {
                  return (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No fetch-run diff data for this view.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    <AnalyticsTimeseriesMeta
                      view={view}
                      granularity={data.granularity}
                      pointCount={stackedPoints.length}
                    />
                    <AnalyticsStackedBarChart points={stackedPoints} />
                  </div>
                );
              }}
            />

            {fetchSummary?.sources.length ? (
              <AnalyticsSectionCard title="Per-Source Fetch Summary">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Source</th>
                        <th className="py-2 pr-3 font-medium">Last run</th>
                        <th className="py-2 pr-3 text-right font-medium">Added</th>
                        <th className="py-2 pr-3 text-right font-medium">Updated</th>
                        <th className="py-2 pr-3 text-right font-medium">Removed</th>
                        <th className="py-2 font-medium">Digest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetchSummary.sources.map((row) => (
                        <tr key={row.source} className="border-b border-border/50 last:border-b-0">
                          <td className="py-2.5 pr-3 font-medium">{row.label}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.last_run_at ? formatDateTime(row.last_run_at) : "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatAnalyticsNumber(row.total_added)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatAnalyticsNumber(row.total_updated)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatAnalyticsNumber(row.total_removed)}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {row.notification_sent_at ? "Sent" : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsSectionCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsSectionCard title="Top Companies">
                <RankedList rows={breakdown.top_companies} />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard title="Top Locations">
                <RankedList rows={breakdown.top_locations} />
              </AnalyticsSectionCard>
            </div>
          </div>
        ) : null}
      </AnalyticsPageState>
    </div>
  );
}

function RankedList({ rows }: { rows: { label: string; count: number; key: string }[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No data for this range.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-foreground">{row.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {formatAnalyticsNumber(row.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}
