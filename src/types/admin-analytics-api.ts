/** Query params shared by analytics endpoints. */
export type AnalyticsGranularity = "day" | "week" | "month";

export type AnalyticsQueryParams = {
  from?: string;
  to?: string;
  source?: string;
  granularity?: AnalyticsGranularity;
  limit?: number;
  offset?: number;
  provider?: string;
  status?: string;
};

export type AnalyticsOverview = {
  total_jobs: number;
  new_jobs: number;
  jobs_added_in_range: number;
  total_applications: number;
  applications_in_range: number;
  active_users: number;
  pending_approvals: number;
  scraper_success_rate_7d: number | null;
};

export type AnalyticsCountRow = {
  key: string;
  label: string;
  count: number;
};

export type AnalyticsJobsBreakdown = {
  by_source: AnalyticsCountRow[];
  by_is_new: { is_new: boolean; count: number }[];
  by_job_type: AnalyticsCountRow[];
  top_companies: AnalyticsCountRow[];
  top_locations: AnalyticsCountRow[];
};

export type AnalyticsFunnelStage = {
  status: string;
  label: string;
  count: number;
  conversion_rate: number | null;
};

export type AnalyticsApplicationsFunnel = {
  stages: AnalyticsFunnelStage[];
  total: number;
  conversion_rates?: {
    interview_rate: number | null;
    offer_rate: number | null;
    failure_rate: number | null;
  };
};

export type AnalyticsApplicationsTimeseriesPoint = {
  date: string;
  total: number;
  by_status: Record<string, number>;
};

export type AnalyticsApplicationsTimeseries = {
  period_from: string | null;
  period_to: string | null;
  granularity: AnalyticsGranularity;
  series: AnalyticsApplicationsTimeseriesPoint[];
};

export type AnalyticsUsersSummary = {
  by_role: AnalyticsCountRow[];
  by_approval_status: AnalyticsCountRow[];
  by_active: { active: boolean; count: number }[];
  email_verified: number;
  email_unverified: number;
  total_users: number;
};

export type AnalyticsTimeseriesPoint = {
  date: string;
  count: number;
};

export type AnalyticsTimeseriesSeries = {
  key: string;
  label: string;
  points: AnalyticsTimeseriesPoint[];
};

export type AnalyticsTimeseries = {
  granularity: AnalyticsGranularity;
  series: AnalyticsTimeseriesSeries[];
};

export type AnalyticsFetchRunSourceSummary = {
  source: string;
  label: string;
  last_run_at: string | null;
  last_status: string | null;
  total_added: number;
  total_updated: number;
  total_removed: number;
  total_unchanged: number;
  success_rate: number | null;
  notification_sent_at: string | null;
};

export type AnalyticsFetchRunsSummary = {
  sources: AnalyticsFetchRunSourceSummary[];
};

export type AnalyticsFetchRunsTimeseries = {
  granularity: AnalyticsGranularity;
  series: {
    source: string;
    label: string;
    points: {
      date: string;
      added: number;
      updated: number;
      unchanged: number;
      removed: number;
    }[];
  }[];
};

export type AnalyticsUserPipeline = {
  user_id: number;
  status_counts: AnalyticsCountRow[];
  recent_applications: {
    id: number;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
  }[];
  follow_ups_due: number;
};

export type AnalyticsScrapingProviderSummary = {
  provider: string;
  provider_label: string | null;
  /** Display label — prefers `provider_label` from the API. */
  label: string;
  success_rate: number | null;
  avg_duration_ms: number | null;
  last_run_at: string | null;
  last_status: string | null;
  run_count: number;
  total_runs: number;
  success_count: number;
  failed_count: number;
  cancelled_count: number;
  added_count: number;
  updated_count: number;
  unchanged_count: number;
  removed_count: number;
  blocked_count: number;
};

export type AnalyticsScrapingSummary = {
  period_from: string | null;
  period_to: string | null;
  total_runs: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  by_provider: AnalyticsScrapingProviderSummary[];
};

export type AnalyticsScrapingTimeseriesPoint = {
  date: string;
  provider: string;
  provider_label: string;
  /** Display label — prefers `provider_label` from the API. */
  label: string;
  total_runs: number;
  success_count: number;
  failed_count: number;
  cancelled_count: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  added_count: number;
  updated_count: number;
  unchanged_count: number;
  removed_count: number;
  blocked_count: number;
};

export type AnalyticsScrapingTimeseries = {
  period_from: string | null;
  period_to: string | null;
  granularity: AnalyticsGranularity;
  series: AnalyticsScrapingTimeseriesPoint[];
  by_provider: AnalyticsScrapingProviderSummary[];
};

export type AnalyticsIngestHealth = {
  created_rate: number | null;
  updated_rate: number | null;
  blocked_rate: number | null;
  failed_rate: number | null;
  total_batches: number;
  window_hours: number;
};

export type AnalyticsScraperLogEntry = {
  id: number;
  name: string;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AnalyticsScraperLogsResponse = {
  items: AnalyticsScraperLogEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type AnalyticsCeleryStatus = {
  queues: { name: string; depth: number }[];
  active_tasks: number;
  failed_tasks_24h: number;
  last_beat_at: string | null;
  workers_online: number;
};

export type AnalyticsTargetsSummary = {
  companies: { total: number; stale: number };
  career_urls: { total: number; stale: number };
  scam_urls: { total: number };
};

export type AnalyticsNotificationsSummary = {
  digests_sent: number;
  digests_pending: number;
  last_sent_at: string | null;
};

export type AnalyticsHealthStatus = "green" | "yellow" | "red";

export type AnalyticsHealthSubsystem = {
  key: string;
  label: string;
  status: AnalyticsHealthStatus;
  message: string | null;
};

export type AnalyticsHealth = {
  overall: AnalyticsHealthStatus;
  subsystems: AnalyticsHealthSubsystem[];
};

export type AnalyticsAlert = {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  href: string | null;
};

export type AnalyticsAlertsResponse = {
  alerts: AnalyticsAlert[];
};
