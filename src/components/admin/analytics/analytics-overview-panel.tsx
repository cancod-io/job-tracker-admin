"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Radar,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { AnalyticsDonutChart } from "@/components/admin/analytics/charts/analytics-donut-chart";
import { AnalyticsFunnelChart } from "@/components/admin/analytics/analytics-funnel-chart";
import { AnalyticsApplicationsOverTimeChart } from "@/components/admin/analytics/analytics-applications-over-time-chart";
import { AnalyticsChartTimeseriesSection } from "@/components/admin/analytics/analytics-chart-timeseries-section";
import { AnalyticsScraperSuccessCard } from "@/components/admin/analytics/analytics-scraper-success-card";
import { AnalyticsTopApplicantsWidget } from "@/components/admin/analytics/analytics-top-applicants-widget";
import { AnalyticsUserSummaryGrid } from "@/components/admin/analytics/analytics-user-summary-grid";
import { AnalyticsKpiCard, AnalyticsKpiGrid } from "@/components/admin/analytics/analytics-kpi-card";
import { AnalyticsOverviewToolbar } from "@/components/admin/analytics/analytics-overview-toolbar";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { AnalyticsExportButton } from "@/components/admin/analytics/analytics-export-button";
import { ScraperRunStatusBadge } from "@/components/admin/api-config/scraper-run-status-badge";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import {
  exportAnalyticsOverview,
  getAnalyticsApplicationsTimeseries,
  getAnalyticsScrapingTimeseries,
} from "@/lib/admin-analytics-api";
import {
  useAnalyticsApplicationsFunnelQuery,
  useAnalyticsJobsBreakdownQuery,
  useAnalyticsOverviewQuery,
  useAnalyticsScrapingSummaryQuery,
  useAnalyticsUsersSummaryQuery,
  useRecentScraperRunsQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import {
  buildNewVsOldDonutSlices,
  buildSourceDonutSlices,
  buildUserSummaryQuadrants,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  pctChange,
  previousPeriodRange,
  sharePercent,
} from "@/lib/analytics-utils";
import { formatDateRange } from "@/lib/date-utils";
import { formatDateTime } from "@/lib/format-date";
import {
  formatScraperProviderLabel,
  formatScraperRunDuration,
} from "@/lib/scraper-provider-utils";
import { useAuth } from "@/providers/auth-provider";
import { useTopApplicantsRealtime } from "@/hooks/use-top-applicants-realtime";

const NEW_OLD_COLORS = ["#10B981", "#94A3B8"] as const;

function formatKpiPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatAnalyticsPercent(value, value <= 1);
}

export function AnalyticsOverviewPanel() {
  const { accessToken } = useAuth();
  const topApplicantsRealtime = useTopApplicantsRealtime();
  const { apiParams, compareApiParams, dateRange, triggerRefresh } = useAnalyticsFilters();

  const overviewQuery = useAnalyticsOverviewQuery(apiParams);
  const compareQuery = useAnalyticsOverviewQuery(compareApiParams ?? {}, {
    enabled: compareApiParams != null,
  });
  const jobsQuery = useAnalyticsJobsBreakdownQuery({ ...apiParams, limit: 10 });
  const funnelQuery = useAnalyticsApplicationsFunnelQuery(apiParams);
  const usersQuery = useAnalyticsUsersSummaryQuery(apiParams);
  const scrapingQuery = useAnalyticsScrapingSummaryQuery(apiParams);
  const recentRunsQuery = useRecentScraperRunsQuery();

  const overview = overviewQuery.data;
  const compareOverview = compareQuery.data ?? null;
  const jobs = jobsQuery.data;
  const funnel = funnelQuery.data;
  const users = usersQuery.data;
  const scraping = scrapingQuery.data ?? null;
  const recentRuns = recentRunsQuery.data?.items ?? [];

  const loading =
    overviewQuery.isLoading ||
    jobsQuery.isLoading ||
    funnelQuery.isLoading ||
    usersQuery.isLoading;

  const refreshing =
    overviewQuery.isFetching ||
    jobsQuery.isFetching ||
    funnelQuery.isFetching ||
    usersQuery.isFetching ||
    scrapingQuery.isFetching ||
    recentRunsQuery.isFetching;

  const error =
    queryErrorMessage(overviewQuery.error) ??
    queryErrorMessage(jobsQuery.error) ??
    queryErrorMessage(funnelQuery.error) ??
    queryErrorMessage(usersQuery.error);

  const compareLabel = useMemo(() => {
    if (!compareApiParams?.from || !compareApiParams?.to) return undefined;
    const prev = previousPeriodRange(dateRange.from, dateRange.to);
    return `vs ${formatDateRange(prev.from, prev.to)}`;
  }, [compareApiParams, dateRange.from, dateRange.to]);

  const kpis = useMemo(() => {
    if (!overview) return null;
    const prev = compareOverview;
    const trend = (current: number, previous: number) =>
      prev ? { pct: pctChange(current, previous), label: compareLabel } : undefined;

    return [
      {
        label: "Total Jobs",
        value: formatAnalyticsNumber(overview.total_jobs),
        icon: Briefcase,
        iconClassName: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
        trend: trend(overview.total_jobs, prev?.total_jobs ?? 0),
      },
      {
        label: "New Jobs",
        value: formatAnalyticsNumber(overview.new_jobs),
        icon: Sparkles,
        iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
        trend: trend(overview.new_jobs, prev?.new_jobs ?? 0),
      },
      {
        label: "Total Applications",
        value: formatAnalyticsNumber(overview.total_applications),
        icon: CheckCircle2,
        iconClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
        trend: trend(overview.total_applications, prev?.total_applications ?? 0),
      },
      {
        label: "Applications Today",
        value:
          topApplicantsRealtime != null
            ? formatAnalyticsNumber(topApplicantsRealtime.applications_today_total)
            : "—",
        icon: CalendarDays,
        iconClassName: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
      },
      {
        label: "Active Users",
        value: formatAnalyticsNumber(overview.active_users),
        icon: Users,
        iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
        trend: trend(overview.active_users, prev?.active_users ?? 0),
      },
      {
        label: "Pending Approvals",
        value: formatAnalyticsNumber(overview.pending_approvals),
        icon: UserCheck,
        iconClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
        invertTrend: true,
        trend: trend(overview.pending_approvals, prev?.pending_approvals ?? 0),
      },
      {
        label: "Scraper Success Rate",
        value: formatKpiPercent(overview.scraper_success_rate_7d),
        icon: Radar,
        iconClassName: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
        trend:
          prev &&
          overview.scraper_success_rate_7d != null &&
          prev.scraper_success_rate_7d != null
            ? {
                pct: pctChange(overview.scraper_success_rate_7d, prev.scraper_success_rate_7d),
                label: compareLabel,
              }
            : undefined,
      },
    ];
  }, [overview, compareOverview, compareLabel, topApplicantsRealtime]);

  const sourceDonut = useMemo(
    () => buildSourceDonutSlices(jobs?.by_source ?? []),
    [jobs],
  );

  const newVsOldDonut = useMemo(
    () => buildNewVsOldDonutSlices(jobs?.by_is_new ?? []),
    [jobs],
  );

  const jobsTotal = jobs?.by_source.reduce((sum, row) => sum + row.count, 0) ?? overview?.total_jobs ?? 0;
  const inventoryTotal =
    newVsOldDonut.reduce((sum, slice) => sum + slice.value, 0) || jobsTotal;
  const topCompaniesTotal = jobs?.top_companies.reduce((sum, row) => sum + row.count, 0) ?? 0;

  const userQuadrants = useMemo(
    () => (users ? buildUserSummaryQuadrants(users) : []),
    [users],
  );

  const scraperSuccessSubtitle = useMemo(() => {
    if (!scraping?.total_runs) return "Per-provider success rate trend";
    const parts = [`${formatAnalyticsNumber(scraping.total_runs)} runs in page range`];
    if (scraping.avg_duration_ms != null) {
      parts.push(`avg ${formatScraperRunDuration(scraping.avg_duration_ms)}`);
    }
    return parts.join(" · ");
  }, [scraping]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics Overview
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Real-time insights about jobs, applications, users and scraping activity.
          </p>
        </div>
        <AnalyticsOverviewToolbar
          onRefresh={triggerRefresh}
          refreshing={refreshing}
          actions={
            accessToken ? (
              <AnalyticsExportButton
                onExport={() => exportAnalyticsOverview(accessToken, apiParams)}
              />
            ) : undefined
          }
        />
      </div>

      <AnalyticsPageState loading={loading} error={error} empty={!overview}>
        {overview && kpis ? (
          <div className="space-y-6">
            <AnalyticsKpiGrid>
              {kpis.map((kpi) => (
                <AnalyticsKpiCard key={kpi.label} {...kpi} />
              ))}
            </AnalyticsKpiGrid>

            <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
              <AnalyticsSectionCard
                title="Jobs by Source"
                className="h-full"
                action={
                  <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
                    View all sources →
                  </Link>
                }
              >
                <AnalyticsDonutChart
                  slices={sourceDonut}
                  centerValue={jobsTotal}
                  centerLabel="Total"
                />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard
                title="New vs Old Jobs"
                className="h-full"
                action={
                  <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
                    View all jobs →
                  </Link>
                }
              >
                <AnalyticsDonutChart
                  slices={newVsOldDonut}
                  centerValue={inventoryTotal}
                  centerLabel="Total"
                  colors={NEW_OLD_COLORS}
                />
              </AnalyticsSectionCard>
              <AnalyticsSectionCard
                title="Top Companies by Job Count"
                className="h-full"
                action={
                  <Link
                    href="/companies"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View full companies →
                  </Link>
                }
              >
                {jobs?.top_companies.length ? (
                  <div className="scrollbar-thin h-[170px] overflow-y-auto overflow-x-auto pr-1">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-card">
                        <tr className="border-b border-border/70 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <th className="py-1.5 pr-2 font-medium">Company</th>
                          <th className="py-1.5 pr-2 text-right font-medium">Jobs</th>
                          <th className="py-1.5 text-right font-medium">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.top_companies.map((row) => (
                          <tr key={row.key} className="border-b border-border/50 last:border-b-0">
                            <td className="max-w-[8rem] truncate py-1.5 pr-2 font-medium text-foreground">
                              {row.label || row.key}
                            </td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                              {formatAnalyticsNumber(row.count)}
                            </td>
                            <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                              {sharePercent(row.count, topCompaniesTotal || jobsTotal).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="flex h-[170px] items-center justify-center text-sm text-muted-foreground">
                    No company data for this range.
                  </p>
                )}
              </AnalyticsSectionCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <AnalyticsSectionCard
                className="xl:col-span-2"
                title="Applications Funnel"
                subtitle={`${formatAnalyticsNumber(funnel?.total ?? 0)} applications in range`}
              >
                <AnalyticsFunnelChart
                  stages={funnel?.stages ?? []}
                  total={funnel?.total ?? 0}
                  layout="wide"
                />
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <AnalyticsSectionCard
                title="User Summary"
                subtitle={users ? `${formatAnalyticsNumber(users.total_users)} users total` : undefined}
                action={
                  <Link
                    href="/users"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all users →
                  </Link>
                }
              >
                <AnalyticsUserSummaryGrid quadrants={userQuadrants} columns={2} compact />
              </AnalyticsSectionCard>

              <AnalyticsTopApplicantsWidget />

              <AnalyticsSectionCard
                title="Recent Scraper Runs"
                action={
                  recentRuns.length > 0 ? (
                    <Link
                      href="/settings/api-config?tab=runs"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View all runs →
                    </Link>
                  ) : undefined
                }
              >
                {recentRuns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-2 font-medium">Source</th>
                          <th className="py-2 pr-2 font-medium">Status</th>
                          <th className="py-2 pr-2 text-right font-medium">Jobs Added</th>
                          <th className="py-2 pr-2 font-medium">Duration</th>
                          <th className="py-2 font-medium">Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRuns.map((run) => (
                          <tr key={run.run_id} className="border-b border-border/50 last:border-b-0">
                            <td className="py-2 pr-2 font-medium text-foreground">
                              {formatScraperProviderLabel(run.provider)}
                            </td>
                            <td className="py-2 pr-2">
                              <ScraperRunStatusBadge status={run.status} />
                            </td>
                            <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">
                              {run.added_count}
                            </td>
                            <td className="py-2 pr-2 tabular-nums text-muted-foreground">
                              {formatScraperRunDuration(run.duration_ms)}
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">
                              {formatDateTime(run.finished_at ?? run.started_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No scraper runs yet. Start a run from API Configuration.
                  </p>
                )}
              </AnalyticsSectionCard>

              <AnalyticsChartTimeseriesSection
                title="Scraper Success Rate"
                subtitle={scraperSuccessSubtitle}
                queryKey={["scraping", "timeseries"]}
                action={
                  <Link
                    href="/analytics/scraping"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View details →
                  </Link>
                }
                fetcher={(token, params) => getAnalyticsScrapingTimeseries(token, params)}
                emptyMessage="No scraper success trend data for this view."
                render={({ data, view }) => (
                  <AnalyticsScraperSuccessCard
                    summary={scraping}
                    timeseries={data}
                    view={view}
                    fallbackRate={overview.scraper_success_rate_7d}
                  />
                )}
              />
            </div>
          </div>
        ) : null}
      </AnalyticsPageState>
    </div>
  );
}
