import type { AnalyticsQueryParams } from "@/types/admin-analytics-api";

/** Stable params object for React Query keys (drops undefined fields). */
export function analyticsParamsKey(params: AnalyticsQueryParams = {}): AnalyticsQueryParams {
  const key: AnalyticsQueryParams = {};
  if (params.from) key.from = params.from;
  if (params.to) key.to = params.to;
  if (params.granularity) key.granularity = params.granularity;
  if (params.source) key.source = params.source;
  if (params.provider) key.provider = params.provider;
  if (params.limit != null) key.limit = params.limit;
  if (params.offset != null) key.offset = params.offset;
  if (params.status) key.status = params.status;
  return key;
}

export const analyticsQueryKeys = {
  all: ["admin", "analytics"] as const,

  overview: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "overview", analyticsParamsKey(params)] as const,

  jobsBreakdown: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "jobs", "breakdown", analyticsParamsKey(params)] as const,

  jobsTimeseries: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "jobs", "timeseries", analyticsParamsKey(params)] as const,

  applicationsFunnel: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "applications", "funnel", analyticsParamsKey(params)] as const,

  applicationsTimeseries: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "applications", "timeseries", analyticsParamsKey(params)] as const,

  applicationsBySource: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "applications", "by-source", analyticsParamsKey(params)] as const,

  usersSummary: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "users", "summary", analyticsParamsKey(params)] as const,

  usersTimeseries: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "users", "timeseries", analyticsParamsKey(params)] as const,

  scrapingSummary: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "scraping", "summary", analyticsParamsKey(params)] as const,

  scrapingTimeseries: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "scraping", "timeseries", analyticsParamsKey(params)] as const,

  fetchRunsSummary: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "fetch-runs", "summary", analyticsParamsKey(params)] as const,

  fetchRunsTimeseries: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "fetch-runs", "timeseries", analyticsParamsKey(params)] as const,

  ingestHealth: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "scraping", "ingest-health", analyticsParamsKey(params)] as const,

  notificationsSummary: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "notifications", "summary", analyticsParamsKey(params)] as const,

  celeryStatus: () => [...analyticsQueryKeys.all, "workers", "celery-status"] as const,

  scraperLogs: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "workers", "scraper-logs", analyticsParamsKey(params)] as const,

  targetsSummary: () => [...analyticsQueryKeys.all, "targets", "summary"] as const,

  health: () => [...analyticsQueryKeys.all, "health"] as const,

  alerts: () => [...analyticsQueryKeys.all, "alerts"] as const,

  recentScraperRuns: () => [...analyticsQueryKeys.all, "scraper-runs", "recent"] as const,

  scraperRunsLog: (params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, "scraper-runs", "log", analyticsParamsKey(params)] as const,
};
