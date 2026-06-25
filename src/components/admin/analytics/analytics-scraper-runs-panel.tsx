"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsScraperSuccessCard } from "@/components/admin/analytics/analytics-scraper-success-card";
import { AnalyticsChartTimeseriesSection } from "@/components/admin/analytics/analytics-chart-timeseries-section";
import { AnalyticsExportButton } from "@/components/admin/analytics/analytics-export-button";
import { AnalyticsKpiCard, AnalyticsKpiGrid } from "@/components/admin/analytics/analytics-kpi-card";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { ScraperRunStatusBadge } from "@/components/admin/api-config/scraper-run-status-badge";
import { DataTable } from "@/components/ui/data-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import { exportAnalyticsScraperRuns, getAnalyticsScrapingTimeseries } from "@/lib/admin-analytics-api";
import {
  useAnalyticsScrapingSummaryQuery,
  useScraperRunsLogQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import {
  formatAnalyticsNumber,
  formatAnalyticsPercent,
} from "@/lib/analytics-utils";
import { formatDateTime } from "@/lib/format-date";
import {
  formatScraperProviderLabel,
  formatScraperRunDuration,
} from "@/lib/scraper-provider-utils";
import { useScraperRunProviders } from "@/hooks/use-scraper-run-providers";
import { useAuth } from "@/providers/auth-provider";

const DEFAULT_PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 30_000;

type AnalyticsScraperRunsPanelProps = {
  embedded?: boolean;
};

export function AnalyticsScraperRunsPanel({ embedded = false }: AnalyticsScraperRunsPanelProps) {
  const { accessToken } = useAuth();
  const { filterOptions } = useScraperRunProviders(accessToken);
  const { apiParams, triggerRefresh } = useAnalyticsFilters();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [providerFilter, setProviderFilter] = useState("all");

  const logParams = useMemo(() => {
    const offset = (page - 1) * pageSize;
    const provider = providerFilter === "all" ? undefined : providerFilter;
    return { limit: pageSize, offset, provider };
  }, [page, pageSize, providerFilter]);

  const summaryQuery = useAnalyticsScrapingSummaryQuery(apiParams);
  const logQuery = useScraperRunsLogQuery(logParams, {
    enabled: Boolean(accessToken),
  });

  const summary = summaryQuery.data ?? null;
  const logData = logQuery.data ?? null;

  const timeseriesExtraParams = useMemo(
    () => (providerFilter === "all" ? undefined : { provider: providerFilter }),
    [providerFilter],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      void logQuery.refetch();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [logQuery]);

  const logRuns = logData?.items ?? [];
  const paginationTotal = Math.max(0, logData?.total ?? 0);
  const paginationPageSize = Math.max(1, logData?.limit ?? pageSize);
  const totalPages = Math.max(1, Math.ceil(paginationTotal / paginationPageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + logRuns.length,
  );

  const loading = logQuery.isLoading;
  const refreshing = summaryQuery.isFetching || logQuery.isFetching;
  const error = queryErrorMessage(logQuery.error) ?? queryErrorMessage(summaryQuery.error);

  return (
    <div className="space-y-6">
      {!embedded ? (
        <AnalyticsPageHeader
          title="Scraping Analytics"
          subtitle="Run history, success rates, and per-provider performance. Auto-refreshes every 30 seconds."
          onRefresh={triggerRefresh}
          refreshing={refreshing}
          actions={
            accessToken ? (
              <AnalyticsExportButton
                onExport={() => exportAnalyticsScraperRuns(accessToken, apiParams)}
              />
            ) : undefined
          }
        />
      ) : null}

      {!embedded && summary ? (
        <AnalyticsKpiGrid>
          <AnalyticsKpiCard
            label="Success rate"
            value={formatAnalyticsPercent(summary.success_rate, true)}
            hint={
              summary.total_runs
                ? `${formatAnalyticsNumber(summary.total_runs)} runs in range`
                : undefined
            }
          />
          <AnalyticsKpiCard
            label="Avg duration"
            value={
              summary.avg_duration_ms != null
                ? formatScraperRunDuration(summary.avg_duration_ms)
                : "—"
            }
          />
          {summary.by_provider.slice(0, 4).map((provider) => (
            <AnalyticsKpiCard
              key={provider.provider}
              label={provider.label || formatScraperProviderLabel(provider.provider)}
              value={formatAnalyticsPercent(provider.success_rate, true)}
              hint={
                provider.total_runs
                  ? `${formatAnalyticsNumber(provider.total_runs)} runs · ${formatAnalyticsNumber(provider.success_count)} ok`
                  : provider.last_run_at
                    ? `Last run: ${formatDateTime(provider.last_run_at)}`
                    : "No runs yet"
              }
            />
          ))}
        </AnalyticsKpiGrid>
      ) : null}

      {!embedded && summary ? (
        <AnalyticsChartTimeseriesSection
          title="Scraper Success Rate"
          subtitle={
            summary.total_runs
              ? `${formatAnalyticsNumber(summary.total_runs)} runs in page range`
              : "Per-provider success rate trend"
          }
          queryKey={["scraping", "timeseries"]}
          extraParams={timeseriesExtraParams}
          fetcher={(token, params) => getAnalyticsScrapingTimeseries(token, params)}
          emptyMessage="No scraper success trend data for this view."
          render={({ data, view }) => (
            <AnalyticsScraperSuccessCard summary={summary} timeseries={data} view={view} />
          )}
        />
      ) : null}

      <AnalyticsPageState
        loading={loading && logRuns.length === 0}
        error={error}
        empty={!loading && logRuns.length === 0 && !error}
        emptyMessage="No scraper runs recorded yet. Start a run from API Configuration → Runs."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Provider</span>
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
                aria-label="Filter run log by provider"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {paginationTotal > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatAnalyticsNumber(paginationTotal)}{" "}
                {paginationTotal === 1 ? "run" : "runs"} total
              </p>
            ) : null}
          </div>

          <DataTable loading={false} minWidth="960px">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Unchanged</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {logRuns.map((run) => (
                <tr
                  key={run.run_id}
                  className="border-b border-border/60 last:border-b-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatScraperProviderLabel(run.provider)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(run.started_at)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sm text-foreground">
                    {formatScraperRunDuration(run.duration_ms)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sm">{run.added_count}</td>
                  <td className="px-4 py-3 tabular-nums text-sm">{run.updated_count}</td>
                  <td className="px-4 py-3 tabular-nums text-sm">{run.unchanged_count}</td>
                  <td className="px-4 py-3">
                    <ScraperRunStatusBadge status={run.status} />
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-xs text-destructive">
                    {run.error_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {logData ? (
            <PaginationBar
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              total={paginationTotal}
              countLabel="runs"
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              disablePrev={page <= 1 || loading || refreshing}
              disableNext={page >= totalPages || loading || refreshing}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      </AnalyticsPageState>
    </div>
  );
}
