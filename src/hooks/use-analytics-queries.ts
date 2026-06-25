"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsAlerts,
  getAnalyticsApplicationsBySource,
  getAnalyticsApplicationsFunnel,
  getAnalyticsApplicationsTimeseries,
  getAnalyticsCeleryStatus,
  getAnalyticsFetchRunsSummary,
  getAnalyticsFetchRunsTimeseries,
  getAnalyticsHealth,
  getAnalyticsIngestHealth,
  getAnalyticsJobsBreakdown,
  getAnalyticsJobsTimeseries,
  getAnalyticsNotificationsSummary,
  getAnalyticsOverview,
  getAnalyticsScraperLogs,
  getAnalyticsScrapingSummary,
  getAnalyticsScrapingTimeseries,
  getAnalyticsTargetsSummary,
  getAnalyticsUsersSummary,
  getAnalyticsUsersTimeseries,
} from "@/lib/admin-analytics-api";
import { analyticsQueryKeys } from "@/lib/analytics-query-keys";
import { listScraperRuns } from "@/lib/admin-scraper-runs-api";
import { useAuth } from "@/providers/auth-provider";
import type { AnalyticsQueryParams } from "@/types/admin-analytics-api";

type AnalyticsQueryOptions = {
  enabled?: boolean;
};

function useAnalyticsAccess(enabled = true) {
  const { accessToken } = useAuth();
  return {
    accessToken,
    enabled: Boolean(accessToken) && enabled,
  };
}

export function useAnalyticsOverviewQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.overview(params),
    queryFn: () => getAnalyticsOverview(accessToken!, params),
    enabled,
  });
}

export function useAnalyticsJobsBreakdownQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.jobsBreakdown(params),
    queryFn: () => getAnalyticsJobsBreakdown(accessToken!, params),
    enabled,
  });
}

export function useAnalyticsJobsTimeseriesQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.jobsTimeseries(params),
    queryFn: () =>
      getAnalyticsJobsTimeseries(accessToken!, params).catch(() => ({
        granularity: "day" as const,
        series: [],
      })),
    enabled,
  });
}

export function useAnalyticsApplicationsFunnelQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.applicationsFunnel(params),
    queryFn: () => getAnalyticsApplicationsFunnel(accessToken!, params),
    enabled,
  });
}

export function useAnalyticsApplicationsTimeseriesQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.applicationsTimeseries(params),
    queryFn: () =>
      getAnalyticsApplicationsTimeseries(accessToken!, params).catch(() => ({
        period_from: null,
        period_to: null,
        granularity: "day" as const,
        series: [],
      })),
    enabled,
  });
}

export function useAnalyticsApplicationsBySourceQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.applicationsBySource(params),
    queryFn: () => getAnalyticsApplicationsBySource(accessToken!, params).catch(() => []),
    enabled,
  });
}

export function useAnalyticsUsersSummaryQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.usersSummary(params),
    queryFn: () => getAnalyticsUsersSummary(accessToken!, params),
    enabled,
  });
}

export function useAnalyticsUsersTimeseriesQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.usersTimeseries(params),
    queryFn: () =>
      getAnalyticsUsersTimeseries(accessToken!, params).catch(() => ({
        granularity: "day" as const,
        series: [],
      })),
    enabled,
  });
}

export function useAnalyticsScrapingSummaryQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.scrapingSummary(params),
    queryFn: () => getAnalyticsScrapingSummary(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsScrapingTimeseriesQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.scrapingTimeseries(params),
    queryFn: () =>
      getAnalyticsScrapingTimeseries(accessToken!, params).catch(() => ({
        period_from: null,
        period_to: null,
        granularity: "day" as const,
        series: [],
        by_provider: [],
      })),
    enabled,
  });
}

export function useAnalyticsFetchRunsSummaryQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.fetchRunsSummary(params),
    queryFn: () => getAnalyticsFetchRunsSummary(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsFetchRunsTimeseriesQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.fetchRunsTimeseries(params),
    queryFn: () => getAnalyticsFetchRunsTimeseries(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsIngestHealthQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.ingestHealth(params),
    queryFn: () => getAnalyticsIngestHealth(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsNotificationsSummaryQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.notificationsSummary(params),
    queryFn: () => getAnalyticsNotificationsSummary(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsCeleryStatusQuery(options: AnalyticsQueryOptions = {}) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.celeryStatus(),
    queryFn: () => getAnalyticsCeleryStatus(accessToken!).catch(() => null),
    enabled,
  });
}

export function useAnalyticsScraperLogsQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.scraperLogs(params),
    queryFn: () => getAnalyticsScraperLogs(accessToken!, params).catch(() => null),
    enabled,
  });
}

export function useAnalyticsTargetsSummaryQuery(options: AnalyticsQueryOptions = {}) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.targetsSummary(),
    queryFn: () => getAnalyticsTargetsSummary(accessToken!),
    enabled,
  });
}

export function useAnalyticsHealthQuery(options: AnalyticsQueryOptions = {}) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.health(),
    queryFn: () => getAnalyticsHealth(accessToken!),
    enabled,
  });
}

export function useAnalyticsAlertsQuery(options: AnalyticsQueryOptions = {}) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.alerts(),
    queryFn: () => getAnalyticsAlerts(accessToken!),
    enabled,
  });
}

export function useRecentScraperRunsQuery(options: AnalyticsQueryOptions = {}) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.recentScraperRuns(),
    queryFn: () =>
      listScraperRuns(accessToken!, { limit: 5 }).catch(() => ({
        items: [],
        total: 0,
        limit: 5,
        offset: 0,
      })),
    enabled,
  });
}

export function useScraperRunsLogQuery(
  params: AnalyticsQueryParams,
  options: AnalyticsQueryOptions = {},
) {
  const { accessToken, enabled } = useAnalyticsAccess(options.enabled);
  return useQuery({
    queryKey: analyticsQueryKeys.scraperRunsLog(params),
    queryFn: () => listScraperRuns(accessToken!, params),
    enabled,
  });
}

export function queryErrorMessage(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Failed to load analytics.";
}
